import { Component, OnInit } from '@angular/core';
import { SpotifyDataService } from '../spotify-data.service'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { GenreChartComponent } from './components/genre-chart/genre-chart.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { TopArtistsComponent } from './components/top-artists/top-artists.component';
import { TopTracksComponent } from './components/top-tracks/top-tracks.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DatePipe } from '@angular/common';

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
    NgxChartsModule 
  ],
   providers: [DatePipe]
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  userProfile: any;
  topArtists: any[] = [];
  topTracks: any[] = [];
  recentPlays: any[] = [];
  genreData: { name: string; value: number }[] = []; 
  topArtistsChartData: any[] = [];
  selectedGenreTimeRange: string = 'medium_term';


  constructor(private dashboardService: SpotifyDataService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      const accessToken = localStorage.getItem('spotify_access_token');

      if (!accessToken) {
        console.error('DashboardComponent: No se encontró el token de acceso. Redirigiendo a login...');
        this.isLoading = false;
        return;
      }

      this.isLoading = true;

      // --- Carga del perfil de usuario ---
      this.userProfile = await this.dashboardService.getUserProfile().toPromise();

      // --- Carga de Top Artists ---
      const rawTopArtistsResponse = await this.dashboardService.getTopArtists(5, accessToken).toPromise();
      this.topArtists = rawTopArtistsResponse?.items || [];

      this.topArtistsChartData = this.topArtists.map((artist: any) => ({
        name: artist.name,
        value: artist.popularity || 0
      }));

      this.genreData = await this.dashboardService.getGenresFromTopTracks(50, this.selectedGenreTimeRange).toPromise();

      // --- Carga de Top Tracks ---
      const rawTopTracksResponse = await this.dashboardService.getTopTracks().toPromise();
      this.topTracks = rawTopTracksResponse?.items || [];

      // --- Carga de Recent Plays (y transformación para line-chart si aplica) ---
      console.log('DashboardComponent: Solicitando actividad reciente...');
      const rawRecentPlaysResponse = await this.dashboardService.getRecentPlays(50).toPromise();
      console.log('DashboardComponent: Respuesta RAW de Recent Plays:', rawRecentPlaysResponse);
      if (rawRecentPlaysResponse && rawRecentPlaysResponse.items && Array.isArray(rawRecentPlaysResponse.items)) {
        const dailyHourlyPlaysMap = new Map<string, Map<string, number>>(); 

        rawRecentPlaysResponse.items.forEach((play: any) => {
          if (play.played_at) {
            const date = new Date(play.played_at);
            const dateString = this.datePipe.transform(date, 'yyyy-MM-dd') || ''; 
            const hourString = this.datePipe.transform(date, 'HH') || '';

            if (!dailyHourlyPlaysMap.has(dateString)) {
              dailyHourlyPlaysMap.set(dateString, new Map<string, number>());
            }
            const hourlyCounts = dailyHourlyPlaysMap.get(dateString)!;
            hourlyCounts.set(hourString, (hourlyCounts.get(hourString) || 0) + 1);
          } 
        });

        const transformedData: any[] = [];
        const sortedDays = Array.from(dailyHourlyPlaysMap.keys()).sort();

        sortedDays.forEach(dateString => {
          const hourlyCounts = dailyHourlyPlaysMap.get(dateString)!;
          const series: any[] = [];

          for (let h = 0; h < 24; h++) {
            const hourKey = String(h).padStart(2, '0'); 
            series.push({
              name: hourKey,
              value: hourlyCounts.get(hourKey) || 0
            });
          }

          transformedData.push({
            name: this.datePipe.transform(new Date(dateString), 'dd/MM/yyyy') || dateString,
            series: series
          });
        });

        this.recentPlays = transformedData;

        if (this.recentPlays.length === 0 || this.recentPlays[0]?.series?.length === 0) {
          console.warn('DashboardComponent: Los datos transformados de Recent Plays no tienen ninguna serie o está vacía.');
        }
      } else {
        console.warn('DashboardComponent: No se recibieron datos de actividad reciente o el formato RAW no es el esperado. Se asignará array vacío a recentPlays.', rawRecentPlaysResponse);
        this.recentPlays = [];
      }
      this.isLoading = false; // Finaliza el estado de carga
    } catch (error) {
      console.error('DashboardComponent: Error al cargar datos del dashboard:', error);
      this.isLoading = false; // Asegura que se desactive la carga incluso en error
    }
  }
}