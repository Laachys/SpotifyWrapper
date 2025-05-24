from flask import Flask, request, jsonify, redirect, url_for
import requests
import os
from dotenv import load_dotenv
from urllib.parse import quote
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from datetime import datetime

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

# Configuración Spotify
SPOTIPY_CLIENT_ID = os.getenv('SPOTIPY_CLIENT_ID')
SPOTIPY_CLIENT_SECRET = os.getenv('SPOTIPY_CLIENT_SECRET')
SPOTIPY_REDIRECT_URI = os.getenv('SPOTIPY_REDIRECT_URI')
SPOTIPY_TOKEN_URL = os.getenv('SPOTIPY_TOKEN_URL')
SPOTIPY_API_BASE_URL = os.getenv('SPOTIPY_API_BASE_URL')


# Conexión a MongoDB (local o Atlas)
MONGODB_URI = os.getenv('SPOTIFYIAYBIGDATA', 'mongodb://localhost:27017/')  
client = MongoClient(MONGODB_URI)
db = client["SPOTIFYIAYBIGDATA"]  
try:
    client.admin.command('ping')
    print("✅ Conectado a MongoDB")
except ConnectionFailure:
    print("❌ Error de conexión a MongoDB")


@app.route('/login')
def login():
    scope = 'user-library-read playlist-read-private user-read-private user-read-email user-top-read user-read-recently-played'
    auth_url = (
        f'https://accounts.spotify.com/authorize?'
        f'response_type=code&'
        f'client_id={SPOTIPY_CLIENT_ID}&'
        f'redirect_uri={quote(SPOTIPY_REDIRECT_URI)}&'
        f'scope={quote(scope)}'
    )
    return redirect(auth_url)
    pass

@app.route('/callback')
def callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Código no proporcionado'}), 400

    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIPY_REDIRECT_URI,
        'client_id': SPOTIPY_CLIENT_ID,
        'client_secret': SPOTIPY_CLIENT_SECRET
    }

    response = requests.post(SPOTIPY_TOKEN_URL, data=token_data)
    if response.status_code != 200:
        return jsonify({'error': 'Error al obtener token'}), 400

    try:
        token_info = response.json()

        headers = {'Authorization': f'Bearer {token_info["access_token"]}'}
        user_response = requests.get('https://api.spotify.com/v1/me', headers=headers)
        user_data = user_response.json()
        if user_response.status_code != 200:
            print(f"Error al obtener datos de usuario: {user_response.text}")
            return jsonify({'error': 'No se pudieron obtener datos del usuario'}), 400
       
        user_doc = {
            'spotify_id': user_data['id'],
            'display_name': user_data.get('display_name', ''),
            'email': user_data.get('email', ''),
            'country': user_data.get('country', ''),
            'followers': user_data.get('followers', {}).get('total', 0),
            'images': user_data.get('images', []),
            'product': user_data.get('product', 'free'),
            'access_token': token_info['access_token'],
            'refresh_token': token_info.get('refresh_token', ''),
            'last_updated': datetime.utcnow()
        }
        
        db.users.update_one(
            {'spotify_id': user_data['id']},
            {'$set': user_doc},
            upsert=True
        )

        return jsonify({
            'access_token': token_info['access_token'],
            'refresh_token': token_info.get('refresh_token', ''),
            'expires_in': token_info['expires_in'],
            'display_name': user_data.get('display_name', user_data.get('id', 'Usuario'))
        })
    except Exception as e:
        return jsonify({'error': f'Error al parsear JSON de Spotify: {e}'}), 500    
    pass

def get_spotify_data(access_token, endpoint, params=None):
    headers = {'Authorization': f'Bearer {access_token}'}
    url = f'{SPOTIPY_API_BASE_URL}{endpoint}'
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

@app.route('/me/playlists', methods=['GET'])
def get_user_playlists():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        access_token = auth_header.split(' ')[1]
        try:
            playlists = get_spotify_data(access_token, '/me/playlists')
            for playlist in playlists['items']:
                db.playlists.update_one(
                    {"spotify_id": playlist["id"]},
                    {
                        "$set": {
                            "name": playlist["name"],
                            "owner_id": playlist["owner"]["id"],
                            "last_updated": datetime.utcnow()
                        }
                    },
                    upsert=True
                )
            return jsonify(playlists)
        except requests.exceptions.HTTPError as e:
            return jsonify({'error': f'Error al obtener playlists: {e}'}), 500
    else:
        return jsonify({'error': 'Token de acceso no proporcionado'}), 401

@app.route('/playlists/<playlist_id>', methods=['GET'])
def get_playlist_tracks_route(playlist_id):
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        access_token = auth_header.split(' ')[1]
        try:
            playlist_data = get_spotify_data(access_token, f'/playlists/{playlist_id}')
            
            if not playlist_data:
                return jsonify({'error': 'No se pudo obtener la playlist'}), 404
            
            if 'tracks' not in playlist_data or 'items' not in playlist_data['tracks']:
                return jsonify({'error': 'La playlist no contiene tracks'}), 404

            saved_tracks = []
            for item in playlist_data['tracks']['items']:
                track = item.get('track')
                if not track:
                    continue
                
                track_doc = {
                    'spotify_id': track['id'],
                    'name': track['name'],
                    'duration_ms': track['duration_ms'],
                    'popularity': track.get('popularity', 0),
                    'artists': [{
                        'id': artist['id'],
                        'name': artist['name']
                    } for artist in track['artists']],
                    'album': {
                        'id': track['album']['id'],
                        'name': track['album']['name'],
                        'images': track['album']['images']
                    },
                    'added_at': datetime.utcnow()
                }
                
                db.tracks.update_one(
                    {'spotify_id': track['id']},
                    {'$set': track_doc},
                    upsert=True
                )
                saved_tracks.append(track['id'])
            
            return jsonify({
                'id': playlist_data['id'],
                'name': playlist_data['name'],
                'description': playlist_data.get('description', ''),
                'images': playlist_data['images'],
                'owner': playlist_data['owner'],
                'followers': playlist_data['followers'],
                'tracks': {
                    'items': playlist_data['tracks']['items'],
                    'total': playlist_data['tracks'].get('total', 0),
                    'limit': playlist_data['tracks'].get('limit', 50),
                    'offset': playlist_data['tracks'].get('offset', 0),
                    'next': playlist_data['tracks'].get('next')
                }
            })
        except requests.exceptions.HTTPError as e:
            return jsonify({'error': f'Error al obtener tracks de la playlist: {e}'}), 500
    else:
        return jsonify({'error': 'Token de acceso no proporcionado'}), 401

@app.route('/refresh_token', methods=['POST'])
def refresh_token():
    refresh_token = request.json.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'Refresh token no proporcionado'}), 400

    token_data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': SPOTIPY_CLIENT_ID,
        'client_secret': SPOTIPY_CLIENT_SECRET,
    }
    response = requests.post(SPOTIPY_TOKEN_URL, data=token_data)
    try:
        response.raise_for_status()
        new_token_info = response.json()
        new_access_token = new_token_info.get('access_token')
        new_refresh_token = new_token_info.get('refresh_token')
        new_expires_in = new_token_info.get('expires_in')

        return jsonify({
            'access_token': new_access_token,
            'refresh_token': new_refresh_token or refresh_token,
            'expires_in': new_expires_in
        })
    except requests.exceptions.HTTPError as e:
        return jsonify({'error': f'Error al refrescar el token: {e}'}), 500

@app.route('/dashboard/playlists/stats', methods=['GET'])
def get_playlists_stats():
    try:
        # 1. Estadísticas básicas
        total_playlists = db.playlists.count_documents({})
        
        # 2. Playlists más populares (por followers)
        top_playlists = list(db.playlists.find()
                           .sort('followers', -1)
                           .limit(5))
        
        # 3. Distribución de tracks por playlist
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'avg_tracks': {'$avg': '$tracks_count'},
                    'min_tracks': {'$min': '$tracks_count'},
                    'max_tracks': {'$max': '$tracks_count'}
                }
            }
        ]
        tracks_stats = list(db.playlists.aggregate(pipeline))[0]
        
        return jsonify({
            'total_playlists': total_playlists,
            'top_playlists': top_playlists,
            'tracks_stats': tracks_stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/playlists/<playlist_id>/stats', methods=['GET'])
def get_playlist_stats(playlist_id):
    try:
        # Obtener datos básicos de la playlist
        playlist = db.playlists.find_one(
            {'spotify_id': playlist_id},
            {'_id': 0, 'name': 1, 'followers': 1, 'tracks_count': 1}
        )
        
        # Estadísticas de audio features
        pipeline = [
            {'$match': {'playlists': playlist_id}},
            {'$group': {
                '_id': None,
                'avg_danceability': {'$avg': '$audio_features.danceability'},
                'avg_energy': {'$avg': '$audio_features.energy'},
                'avg_duration': {'$avg': '$duration_ms'},
                'total_tracks': {'$sum': 1}
            }}
        ]
        stats = list(db.tracks.aggregate(pipeline))[0] if db.tracks.aggregate(pipeline) else {}
        
        return jsonify({
            'playlist_info': playlist,
            'audio_stats': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/user/profile')
def get_profile():
   # Primero verificar si tenemos datos en MongoDB
    user_data = db.users.find_one()

    # Comprobación de la fecha de expiración
    # Es crucial definir 'expires_at_timestamp' con un valor por defecto o validarlo
    expires_at_timestamp = user_data.get('expires_at') if user_data else None

    # Si no hay datos de usuario, o si la fecha de expiración no existe o es inválida,
    # o si la fecha de expiración es menor que la actual, actualiza desde Spotify.
    if not user_data or \
       expires_at_timestamp is None or \
       expires_at_timestamp < datetime.now().timestamp():
        
        # Aquí es donde sp.current_user() causa problemas, ya que sp no está definido
        # Necesitas un 'sp' (Spotipy client) o un access_token para hacer la llamada a Spotify.
        # Por ahora, voy a asumir que tienes el access_token disponible para esta ruta
        # (por ejemplo, desde el encabezado Authorization, como haces en /me/playlists).

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token de acceso no proporcionado para actualizar perfil'}), 401
        access_token = auth_header.split(' ')[1]

        try:
            # Asegúrate de que SPOTIPY_API_BASE_URL esté configurado correctamente
            # y que /me sea el endpoint correcto para el perfil de usuario.
            headers = {'Authorization': f'Bearer {access_token}'}
            spotify_response = requests.get(f'{os.getenv("SPOTIPY_API_BASE_URL")}/me', headers=headers)
            spotify_response.raise_for_status() # Lanza excepción para errores HTTP
            spotify_data = spotify_response.json()

            # Calcula expires_at correctamente
            # Si el token de acceso actual tiene un 'expires_in' en segundos, úsalo.
            # Si estás refrescando un token, la lógica de 'expires_in' debería manejarlo.
            # Aquí, para simplificar, asumimos que el token es válido por 1 hora si lo obtuviste.
            expires_at = datetime.now().timestamp() + 3600 # O un valor real si lo tienes en el token

            user_doc = {
                'spotify_id': spotify_data['id'],
                'display_name': spotify_data.get('display_name', ''),
                'images': spotify_data.get('images', []),
                'followers': spotify_data.get('followers',[]),
                'country': spotify_data.get('country', ''),
                'product': spotify_data['product'],
                'updated_at': datetime.now(),
                'expires_at': expires_at # Guardamos el timestamp
            }
            db.users.update_one({'spotify_id': spotify_data['id']}, {'$set': user_doc}, upsert=True)
            user_data = user_doc # Actualiza user_data para que la función retorne los datos frescos
        except requests.exceptions.HTTPError as e:
            return jsonify({'error': f'Error al obtener el perfil de Spotify: {e}'}), spotify_response.status_code
        except Exception as e:
            return jsonify({'error': f'Error inesperado al actualizar el perfil: {e}'}), 500

    # Si se actualizó o ya existía y era válido
    # Eliminamos el campo '_id' de MongoDB antes de enviarlo al cliente
    if user_data and '_id' in user_data:
        user_data.pop('_id')
        
    return jsonify(user_data)

@app.route('/user/top/artists')
def get_top_artists():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token de acceso no proporcionado para obtener artistas principales'}), 401
    access_token = auth_header.split(' ')[1]

    limit = request.args.get('limit', default=5, type=int)
    time_range = request.args.get('time_range', default='medium_term')

    cache_key = f"top_artists_{time_range}_{limit}"
    cached = db.cache.find_one({'key': cache_key})

    # Convierte la hora actual a un timestamp flotante para la comparación
    current_time_timestamp = datetime.now().timestamp()
    
    # Usa .get con un valor por defecto para manejar 'expires_at' ausente
    if not cached or cached.get('expires_at', 0) < current_time_timestamp:
        try:
            # Usa tu función get_spotify_data existente
            # El endpoint de la API de Spotify para los artistas principales es /me/top/artists
            # Los parámetros para limit y time_range se pasan como un diccionario.
            artists = get_spotify_data(
                access_token,
                '/me/top/artists',
                params={'limit': limit, 'time_range': time_range}
            )
            
            # Almacena los datos en la caché
            db.cache.update_one(
                {'key': cache_key},
                {'$set': {
                    'data': artists,
                    'expires_at': datetime.now().timestamp() + 3600 # Caché por 1 hora
                }},
                upsert=True
            )
        except requests.exceptions.HTTPError as e:
            # Captura errores HTTP específicos de las llamadas a la API de Spotify
            return jsonify({'error': f'Error al obtener artistas principales de Spotify: {e}'}), e.response.status_code
        except Exception as e:
            # Captura cualquier otro error inesperado
            return jsonify({'error': f'Error inesperado al obtener artistas principales: {e}'}), 500
    else:
        artists = cached['data']

    return jsonify(artists)

@app.route('/user/top/tracks', methods=['GET'])
def get_top_tracks():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token de acceso no proporcionado para obtener canciones principales'}), 401
    access_token = auth_header.split(' ')[1]

    limit = request.args.get('limit', default=5, type=int)
    time_range = request.args.get('time_range', default='medium_term', type=str) # Default time_range for tracks

    # Optional: Implement caching for top tracks as well, similar to top artists
    cache_key = f"top_tracks_{time_range}_{limit}"
    cached = db.cache.find_one({'key': cache_key})
    current_time_timestamp = datetime.now().timestamp()

    if not cached or cached.get('expires_at', 0) < current_time_timestamp:
        try:
            # Use your existing get_spotify_data function
            # The Spotify API endpoint for top tracks is /me/top/tracks
            tracks = get_spotify_data(
                access_token,
                '/me/top/tracks',
                params={'limit': limit, 'time_range': time_range}
            )

            # Store the data in cache
            db.cache.update_one(
                {'key': cache_key},
                {'$set': {
                    'data': tracks,
                    'expires_at': datetime.now().timestamp() + 3600 # Cache for 1 hour
                }},
                upsert=True
            )
        except requests.exceptions.HTTPError as e:
            print(f"Error calling Spotify API for top tracks: {e.response.text}")
            return jsonify({'error': 'Error al obtener canciones principales de Spotify', 'details': e.response.text}), e.response.status_code
        except Exception as e:
            print(f"Internal server error fetching top tracks: {e}")
            return jsonify({'error': 'Error inesperado al obtener canciones principales', 'details': str(e)}), 500
    else:
        tracks = cached['data']

    return jsonify(tracks)

@app.route('/user/top/genres_from_tracks', methods=['GET'])
def get_genres_from_top_tracks():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token de acceso no proporcionado'}), 401
    access_token = auth_header.split(' ')[1]

    # Puedes ajustar el límite de tracks para un análisis más profundo.
    # Un límite de 50 o 100 puede ser una buena opción.
    limit_tracks = request.args.get('limit_tracks', default=100, type=int) 
    time_range = request.args.get('time_range', default='medium_term', type=str)

    # --- Parte 1: Obtener los Top Tracks del usuario ---
    # Usar la caché para los top tracks (similar a como ya lo haces)
    top_tracks_cache_key = f"top_tracks_{time_range}_{limit_tracks}"
    cached_tracks = db.cache.find_one({'key': top_tracks_cache_key})
    current_time_timestamp = datetime.now().timestamp()

    tracks_data = None
    if cached_tracks and cached_tracks.get('expires_at', 0) > current_time_timestamp:
        print(f"DEBUG: Recuperando Top Tracks de la caché (key: {top_tracks_cache_key})")
        tracks_data = cached_tracks['data']
    else:
        print(f"DEBUG: Obteniendo Top Tracks de Spotify (limit={limit_tracks}, time_range={time_range})")
        try:
            # Llama a la API de Spotify para obtener los top tracks
            tracks_data = get_spotify_data(
                access_token,
                '/me/top/tracks',
                params={'limit': limit_tracks, 'time_range': time_range}
            )
            # Almacena los top tracks en la caché
            db.cache.update_one(
                {'key': top_tracks_cache_key},
                {'$set': {
                    'data': tracks_data,
                    'expires_at': datetime.now().timestamp() + 3600 # Caché por 1 hora
                }},
                upsert=True
            )
        except requests.exceptions.HTTPError as e:
            print(f"Error calling Spotify API for top tracks: {e.response.text}")
            return jsonify({'error': 'Error al obtener canciones principales de Spotify', 'details': e.response.text}), e.response.status_code
        except Exception as e:
            print(f"Internal server error fetching top tracks: {e}")
            return jsonify({'error': 'Error inesperado al obtener canciones principales', 'details': str(e)}), 500
    
    if not tracks_data or not tracks_data.get('items'):
        print("DEBUG: No se recibieron Top Tracks o están vacíos.")
        return jsonify({'genre_data': []})

    # --- Parte 2: Extraer artistas únicos de los Top Tracks ---
    genre_counts = {}
    artist_ids_to_fetch = set() # Usar un set para almacenar ID's únicos de artistas

    for item in tracks_data['items']:
        # La respuesta de '/me/top/tracks' tiene los artistas directamente en el nivel superior del 'item'
        # No están anidados bajo una propiedad 'track' como en las playlists
        if 'artists' in item:
            for artist in item['artists']: 
                artist_ids_to_fetch.add(artist['id'])

    print(f"DEBUG: Artistas únicos encontrados en Top Tracks: {len(artist_ids_to_fetch)}")

    # --- Parte 3: Obtener géneros para cada artista único ---
    for artist_id in list(artist_ids_to_fetch): # Convertir a lista para iterar
        artist_cache_key = f"artist_details_{artist_id}"
        cached_artist = db.cache.find_one({'key': artist_cache_key})
        
        artist_details = None
        if cached_artist and cached_artist.get('expires_at', 0) > current_time_timestamp:
            # print(f"DEBUG: Recuperando detalles del artista {artist_id} de la caché.")
            artist_details = cached_artist['data']
        else:
            # print(f"DEBUG: Obteniendo detalles del artista {artist_id} de Spotify.")
            try:
                # Llama a la API de Spotify para obtener detalles del artista
                artist_details = get_spotify_data(
                    access_token,
                    f'/artists/{artist_id}'
                )
                # Almacena los detalles del artista en la caché
                db.cache.update_one(
                    {'key': artist_cache_key},
                    {'$set': {
                        'data': artist_details,
                        'expires_at': datetime.now().timestamp() + (7 * 24 * 3600) # Cache artist details por 7 días
                    }},
                    upsert=True
                )
            except requests.exceptions.HTTPError as e:
                print(f"Error fetching artist {artist_id} details: {e.response.text}")
                # Continúa con el siguiente artista si hay un error
                continue
            except Exception as e:
                print(f"Unexpected error fetching artist {artist_id} details: {e}")
                continue

        # --- Parte 4: Consolidar y contar géneros ---
        if artist_details and artist_details.get('genres'):
            for genre in artist_details['genres']:
                # Normaliza el género (por ejemplo, a minúsculas) para evitar duplicados como "Pop" y "pop"
                normalized_genre = genre.lower() 
                genre_counts[normalized_genre] = genre_counts.get(normalized_genre, 0) + 1

    print(f"DEBUG: Conteo final de géneros: {genre_counts}")

    # --- Parte 5: Formatear para ngx-charts ---
    # `ngx-charts` espera un array de objetos { name: 'Género', value: count }
    formatted_genre_data = [{'name': g.title(), 'value': c} for g, c in genre_counts.items()] # .title() capitaliza la primera letra

    # Opcional: Ordenar los géneros por conteo descendente
    formatted_genre_data.sort(key=lambda x: x['value'], reverse=True)
    # limit_genres = request.args.get('limit_genres', default=10, type=int) # Nuevo parámetro opcional
    formatted_genre_data = formatted_genre_data[:15]

    return jsonify(formatted_genre_data)

@app.route('/user/recent', methods=['GET'])
def get_user_recent_plays():
    access_token = request.headers.get('Authorization')
    if not access_token:
        return jsonify({"error": "Authorization token is missing"}), 401

    # Remove "Bearer " prefix
    spotify_access_token = access_token.split(" ")[1]

    limit = request.args.get('limit', default=50, type=int) # Get limit from query params

    # Implement your Spotify API call here
    # Example using requests (you might use spotipy or similar)
    headers = {
        'Authorization': f'Bearer {spotify_access_token}'
    }
    spotify_url = f'https://api.spotify.com/v1/me/player/recently-played?limit={limit}'
    response = requests.get(spotify_url, headers=headers)

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Failed to fetch recent plays from Spotify", "details": response.json()}), response.status_code
    
if __name__ == '__main__':
    app.run(debug=True)