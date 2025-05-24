import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SpotifyAuthService } from './spotify-auth.service';
import { environment } from 'src/environments/environment';
import {
  SpotifyPlaylist,
  SpotifyPagination,
  FormattedTrack,
  SpotifyPlaylistTracksResponse,
} from './models/spotify.interfaces';

@Injectable({
  providedIn: 'root',
})
export class SpotifyDataService {
  private http = inject(HttpClient);
  private spotifyAuthService = inject(SpotifyAuthService);
  private backendUrl = environment.backendUrl;

  private get headers(): HttpHeaders {
    const accessToken = this.spotifyAuthService.getAccessToken();
    if (!accessToken) throw new Error('No access token available');

    return new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get user's playlists with improved typing
   */
  getUserPlaylists(): Observable<any> {
    const accessToken = this.spotifyAuthService.getAccessToken();
    if (!accessToken) {
      return throwError(() => new Error('No access token available'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.get<SpotifyPagination<SpotifyPlaylist>>(`${this.backendUrl}/me/playlists`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error al obtener las playlists:', error);
          return throwError(() => new Error('Error al cargar playlists. Intente nuevamente.'));
        })
      );
  }

  /**
   * Get playlist tracks with typed response
   */

  getPlaylistTracks(
    playlistId: string,
    limit = 50,
    offset = 0
  ): Observable<SpotifyPagination<FormattedTrack>> {
    return this.http.get<SpotifyPlaylistTracksResponse>(
      `${this.backendUrl}/playlists/${playlistId}/tracks`,
      {
        headers: this.headers,
        params: {
          limit: limit.toString(),
          offset: offset.toString()
        }
      }
    ).pipe(
      map(response => {
        if (!response || !response.items) {
          throw new Error('Estructura de respuesta inválida');
        }

        const items = response.items
          .filter(item => item?.track)
          .map((item, index) => ({
            position: offset + index + 1,
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists?.map(a => a.name) || ['Artista desconocido'],
            album: item.track.album?.name || 'Álbum desconocido',
            duration: this.formatDuration(item.track.duration_ms || 0),
            previewUrl: item.track.preview_url || null,
            image: item.track.album?.images?.[0]?.url || null
          }));

        return {
          items,
          total: response.total || items.length,
          limit: response.limit || limit,
          offset: response.offset || offset,
          next: this.getNextOffset(response, limit, offset)
        };
      }),
      catchError(error => this.handleError(error))
    );
  }

  private getNextOffset(response: SpotifyPlaylistTracksResponse, limit: number, offset: number): string | null {
    if (!response.next) return null;
    if (offset + limit >= (response.total || 0)) return null;
    return `limit=${limit}&offset=${offset + limit}`;
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${(+seconds < 10 ? '0' : '')}${seconds}`;
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en SpotifyDataService:', error);
    return throwError(() => ({
      status: error.status,
      message: error.error?.error?.message || 'Error al comunicarse con Spotify API'
    }));
  }
  /**
   * Get playlist details with typed response
   */
  getPlaylistDetails(playlistId: string): Observable<SpotifyPlaylist> {
    return this.http.get<SpotifyPlaylist>(
      `${this.backendUrl}/playlists/${playlistId}`,
      { headers: this.headers }
    ).pipe(
      map(response => {
        if (!response || !response.tracks || !response.tracks.items) {
          throw new Error('Estructura de respuesta inválida');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }
  getPlaylistsStats(playlistId: string) {
    return this.http.get(`${this.backendUrl}/dashboard/playlists/stats`);
  }

  getGenresFromTopTracks(limitTracks = 100, timeRange: string = 'medium_term'): Observable<any> {
    const accessToken = this.spotifyAuthService.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('No access token available for getGenresFromTopTracks'));
    }
    return this.http.get(`${this.backendUrl}/user/top/genres_from_tracks`, {
      headers: this.headers,
      params: {
        limit_tracks: limitTracks.toString(),
        time_range: timeRange
      }
    });
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/profile`, { headers: this.headers });
  }

  getTopArtists(limit = 8, accessToken: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/top/artists?limit=${limit}`, { headers: this.headers });
  }

  getTopTracks(limit = 10): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/top/tracks?limit=${limit}`, { headers: this.headers });
  }

  getRecentPlays(limit = 50): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/recent?limit=${limit}`, { headers: this.headers });
  }

}