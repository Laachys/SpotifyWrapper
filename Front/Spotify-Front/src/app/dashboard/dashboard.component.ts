import { Component, OnInit } from '@angular/core';
import { SpotifyDataService } from '../spotify-data.service'; // Asegúrate que la ruta sea correcta
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// Importa todos los componentes hijos que usas
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { GenreChartComponent } from './components/genre-chart/genre-chart.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { TopArtistsComponent } from './components/top-artists/top-artists.component';
import { TopTracksComponent } from './components/top-tracks/top-tracks.component';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts'; // Importa ScaleType para el colorScheme

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    MatProgressSpinnerModule,
    ProfileCardComponent,
    GenreChartComponent,
    TopTracksComponent,
    RecentActivityComponent,
    TopArtistsComponent,
    NgxChartsModule // Necesario si tienes algún ngx-charts directamente en dashboard.component.html (como recentPlays)
  ]
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  userProfile: any;
  topArtists: any[] = [];
  topTracks: any[] = [];
  recentPlays: any[] = [];
  genreData: any[] = []; // Inicializado como array vacío, tipo array de 'any'
  topArtistsChartData: any[] = [];

  // Configuración de gráficos para el gráfico de actividad reciente (si está en este componente)
  colorScheme = {
    name: 'spotify',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1DB954', '#191414', '#B3B3B3', '#535353', '#FFFFFF']
  };

  constructor(private dashboardService: SpotifyDataService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      const accessToken = localStorage.getItem('spotify_access_token');

      if (!accessToken) {
        console.error('DashboardComponent: No se encontró el token de acceso. Redirigiendo a login...');
        this.isLoading = false;
        // Puedes añadir una redirección aquí: this.router.navigate(['/login']);
        return;
      }

      // --- Carga del perfil de usuario ---
      this.userProfile = await this.dashboardService.getUserProfile().toPromise(); // Pasa el token
      console.log('DashboardComponent: Perfil de usuario cargado:', this.userProfile);

      // --- Carga de Top Artists ---
      const rawTopArtistsResponse = await this.dashboardService.getTopArtists(5, accessToken).toPromise();
      this.topArtists = rawTopArtistsResponse?.items || []; // Asegúrate de manejar la ausencia de 'items'
      console.log('DashboardComponent: Top Artists RAW recibidos:', this.topArtists);

      // --- Transformación de Top Artists para su gráfico (en TopArtistsComponent) ---
      this.topArtistsChartData = this.topArtists.map((artist: any) => ({
        name: artist.name,
        value: artist.popularity || 0 // Usa popularidad, o 0 si no existe
      }));
      console.log('DashboardComponent: Datos transformados para TopArtistsChart:', this.topArtistsChartData);

      // --- Procesamiento de Géneros ---
      // Asegúrate de que this.topArtists esté cargado antes de procesar géneros
      if (this.topArtists.length > 0) {
        this.processGenreData();
      } else {
        console.warn('DashboardComponent: No se recibieron top artists, no se pueden procesar los géneros.');
        this.genreData = []; // Asegura que esté vacío si no hay artistas
      }
      console.log('DashboardComponent: Datos de género procesados:', this.genreData);

      // --- Carga de Top Tracks ---
      const rawTopTracksResponse = await this.dashboardService.getTopTracks().toPromise(); // Pasa el token
      this.topTracks = rawTopTracksResponse?.items || [];
      console.log('DashboardComponent: Top Tracks RAW recibidos:', this.topTracks);


      // --- Carga de Recent Plays (y transformación para line-chart si aplica) ---
      const rawRecentPlaysResponse = await this.dashboardService.getRecentPlays().toPromise(); // Pasa el token y un límite
      // EJEMPLO DE TRANSFORMACIÓN PARA RECENT PLAYS A FORMATO NGX-CHARTS LINE-CHART
      // Esto asume que rawRecentPlaysResponse.items contiene objetos con una propiedad 'played_at' y un 'track'
      if (rawRecentPlaysResponse && rawRecentPlaysResponse.items && Array.isArray(rawRecentPlaysResponse.items)) {
        const dailyPlaysMap = new Map<string, number>(); // 'YYYY-MM-DD' -> count

        rawRecentPlaysResponse.items.forEach((play: any) => {
          if (play.played_at) {
            const date = new Date(play.played_at);
            const dateString = date.toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'
            dailyPlaysMap.set(dateString, (dailyPlaysMap.get(dateString) || 0) + 1);
          }
        });

        this.recentPlays = [{
          name: 'Reproducciones Diarias',
          series: Array.from(dailyPlaysMap).map(([date, count]) => ({
            name: new Date(date), // ngx-charts puede manejar objetos Date para el eje X
            value: count
          })).sort((a, b) => a.name.getTime() - b.name.getTime()) // Ordena por fecha
        }];
        console.log('DashboardComponent: Datos transformados para RecentPlays (line-chart):', this.recentPlays);
      } else {
        console.warn('DashboardComponent: No se recibieron datos de actividad reciente o el formato no es el esperado.');
        this.recentPlays = [];
      }

      this.isLoading = false; // Finaliza el estado de carga
    } catch (error) {
      console.error('DashboardComponent: Error al cargar datos del dashboard:', error);
      this.isLoading = false; // Asegura que se desactive la carga incluso en error
    }
  }

  private processGenreData() {
    console.log('DashboardComponent: Iniciando procesamiento de datos de género.');
    console.log('DashboardComponent: Artistas a procesar para géneros:', this.topArtists);

    if (this.topArtists && this.topArtists.length > 0) {
      const genreCount: { [key: string]: number } = {};

      this.topArtists.forEach((artist: any) => {
        // MUY IMPORTANTE: Verifica que 'genres' exista y sea un ARRAY de strings
        if (artist.genres && Array.isArray(artist.genres) && artist.genres.every((g: any) => typeof g === 'string')) {
          artist.genres.forEach((genre: string) => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        } else {
          console.warn(`DashboardComponent: Artista '${artist.name || 'Desconocido'}' no tiene géneros válidos o la propiedad 'genres' no es un array de strings. Valor de genres:`, artist.genres);
        }
      });

      this.genreData = Object.keys(genreCount).map(genre => ({
        name: genre,
        value: genreCount[genre]
      }));
      console.log('DashboardComponent: genreData FINAL (después de procesamiento):', this.genreData);
    } else {
      console.warn('DashboardComponent: No hay artistas en this.topArtists para procesar géneros. genreData se mantendrá vacío.');
      this.genreData = [];
    }
  }
}