import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { SpotifyDataService } from '../../../spotify-data.service'; // Asegúrate de la ruta correcta a tu servicio
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-top-artists',
  standalone: true,
  templateUrl: './top-artists.component.html',
  styleUrls: ['./top-artists.component.scss'],
  imports: [
    NgxChartsModule
  ]
})
export class TopArtistsComponent implements OnInit, OnChanges {
  // Variable para almacenar los datos transformados para ngx-charts
   @Input() topArtistsChartData: any[] = []; // ¡Debe ser inicializado como un array vacío!
  
  // Opcional: para mostrar la lista de artistas con nombre e imagen
   @Input() topArtistsList: any[] = []; // Para mostrar la lista de artistas (nombre, imagen)

  // Propiedades para la configuración del gráfico ngx-charts
  view: [number, number] = [700, 400]; // Ajusta el tamaño según tus necesidades
  showXAxis = true;
  showYAxis = true;
  gradient = false; // Puedes ponerlo en true si quieres un degradado
  showLegend = true; // Mostrar leyenda
  showXAxisLabel = true;
  showLabels = true;
  xAxisLabel = 'Artista';
  showYAxisLabel = true;
  yAxisLabel = 'Popularidad'; // O el valor que estés graficando (ej. 'Seguidores')
  colorScheme = {
    name: 'spotify',
    selectable: true,
    group: ScaleType.Ordinal, // Necesitas importar ScaleType
    domain: ['#1DB954', '#191414', '#B3B3B3', '#535353', '#FFFFFF']
  };

  constructor(private spotifyService: SpotifyDataService) { }

  ngOnInit(): void {
  }
// Usamos ngOnChanges para reaccionar cuando los datos @Input cambian (ej. cuando llegan del padre)
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['topArtistsChartData'] && changes['topArtistsChartData'].currentValue) {
      // Si quieres hacer algo específico cuando los datos del gráfico se actualizan
      console.log('Datos del gráfico de artistas actualizados en TopArtistsComponent:', this.topArtistsChartData);
    }
    if (changes['topArtistsList'] && changes['topArtistsList'].currentValue) {
      // Si quieres hacer algo específico cuando la lista de artistas se actualiza
      console.log('Lista de artistas actualizada en TopArtistsComponent:', this.topArtistsList);
    }
  }

  loadTopArtists(): void {
    const accessToken = localStorage.getItem('spotify_access_token'); // Obtén el token

    if (accessToken) {
      this.spotifyService.getTopArtists(5, accessToken).subscribe({
        next: (data) => {
          console.log('Datos RAW de top artists recibidos:', data);

          // Asegúrate de que 'data' y 'data.items' existen y es un array
          if (data && data.items && Array.isArray(data.items)) {
            // 1. Datos para el GRÁFICO (name, value)
            this.topArtistsChartData = data.items.map((artist: any) => ({
              name: artist.name,
              value: artist.popularity // Asumiendo que quieres graficar la popularidad
            }));
            console.log('Datos transformados para ngx-charts:', this.topArtistsChartData);

            // 2. Datos para la LISTA (nombre, imagen, etc.) - Si quieres mostrar más que el gráfico
            this.topArtistsList = data.items.map((artist: any) => ({
                name: artist.name,
                imageUrl: artist.images[0]?.url || 'assets/default-artist.png', // Primera imagen, o una por defecto
                popularity: artist.popularity,
                followers: artist.followers.total
                // Puedes añadir más propiedades si las necesitas en tu plantilla
            }));
            console.log('Datos para la lista de artistas:', this.topArtistsList);

          } else {
            console.warn('La respuesta de topArtists no contiene un array "items" esperado.', data);
            this.topArtistsChartData = []; // Asegura que el array del gráfico esté vacío
            this.topArtistsList = []; // Asegura que el array de la lista esté vacío
          }
        },
        error: (err) => {
          console.error('Error cargando los artistas principales:', err);
          this.topArtistsChartData = [];
          this.topArtistsList = [];
          // Considera mostrar un mensaje de error al usuario
        }
      });
    } else {
      console.warn('No se encontró el token de acceso para cargar los artistas principales.');
      this.topArtistsChartData = [];
      this.topArtistsList = [];
      // Lógica para redirigir al login si no hay token
    }
  }

  // Métodos para los eventos del gráfico (opcional)
  onSelect(event: any): void {
    console.log(event);
  }
}