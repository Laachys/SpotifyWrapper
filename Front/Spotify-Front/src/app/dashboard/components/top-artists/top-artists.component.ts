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
export class TopArtistsComponent implements OnInit{
   @Input() topArtistsChartData: any[] = []; 
  
   @Input() topArtistsList: any[] = []; 

  // Propiedades para la configuración del gráfico ngx-charts
  showXAxis = true;
  showYAxis = true;
  gradient = false; 
  showLegend = true; 
  showXAxisLabel = true;
  showLabels = true;
  xAxisLabel = 'Artista';
  showYAxisLabel = true;
  yAxisLabel = 'Popularidad'; 
  colorScheme = {
    name: 'spotify',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1DB954', '	#232723', '	#e1ece3', '#457e59', '	#a8b2a8']
  };

  constructor(private spotifyService: SpotifyDataService) { }

  ngOnInit(): void {
  }

  loadTopArtists(): void {
    const accessToken = localStorage.getItem('spotify_access_token');

    if (accessToken) {
      this.spotifyService.getTopArtists(5, accessToken).subscribe({
        next: (data) => {
        
          if (data && data.items && Array.isArray(data.items)) {
            this.topArtistsChartData = data.items.map((artist: any) => ({
              name: artist.name,
              value: artist.popularity 
            }));

          } else {
            this.topArtistsChartData = []; 
            this.topArtistsList = []; 
          }
        },
        error: (err) => {
          this.topArtistsChartData = [];
          this.topArtistsList = [];
        }
      });
    } else {
      this.topArtistsChartData = [];
      this.topArtistsList = [];
    }
  }
}