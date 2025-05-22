import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyDataService } from '../spotify-data.service';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatToolbarModule} from '@angular/material/toolbar';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { 
  SpotifyPlaylist, 
  SpotifyPlaylistTrack,
  SpotifyPagination,
  FormattedTrack,
  FormattedPlaylist
} from '../models/spotify.interfaces';
import { finalize, Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardComponent } from '@app/dashboard/dashboard.component';
import { MatTabsModule } from '@angular/material/tabs';
import { SpotifyAuthService } from '@app/spotify-auth.service';

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    InfiniteScrollModule,
    DashboardComponent,
    MatTabsModule
  ],
  templateUrl: './playlists.component.html',
  styleUrls: ['./playlists.component.scss']
})
export class PlaylistsComponent implements OnInit {
  private spotifyService = inject(SpotifyDataService);
  private spotifyAuthService = inject(SpotifyAuthService);
  private destroy$ = new Subject<void>();
  
  playlists: SpotifyPlaylist[] = [];
  selectedPlaylist: FormattedPlaylist | null = null;
  isLoading = false;
  loadingMore = false;
  allTracksLoaded = false;
  error: string | null = null;
  currentAudio: HTMLAudioElement | null = null;
  currentlyPlayingTrackId: string | null = null;
  playlistStats: any;
  showStats = false;
  userName: Subscription | undefined;
  userDisplayName: string = 'Invitado';

  constructor(public authService: SpotifyAuthService) {
   
  }

  ngOnInit(): void {
    this.loadPlaylists();
     this.userName  = this.authService.user$.subscribe(user => {
      if (user && user.display_name) {
        this.userDisplayName = user.display_name;
      } else {
        this.userDisplayName = 'Invitado'; // Si no hay usuario o nombre
      }
    });
  }

  loadPlaylists(): void {
    this.isLoading = true;
    this.spotifyService.getUserPlaylists().subscribe({
      next: (data: SpotifyPagination<SpotifyPlaylist>) => {
        this.playlists = data.items;
        console.log(this.playlists)
        this.isLoading = false;
        this.error = null;
      },
      error: (error) => {
        this.error = this.handlePlaylistError(error);
        this.isLoading = false;
        console.error('Error loading playlists:', error);
      }
    });
  }

  toggleStats() {
    this.showStats = !this.showStats;
  }

  showPlaylistDetails(playlistId: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.spotifyService.getPlaylistDetails(playlistId).subscribe({
      next: (response: SpotifyPlaylist) => {
        this.selectedPlaylist = this.formatPlaylistResponse(response);
        this.isLoading = false;
        this.scrollToPlaylistDetails();
      },
      error: (err) => {
        this.error = this.handlePlaylistError(err);
        this.isLoading = false;
        console.error('Error loading playlist details:', err);
      }
    });
    this.spotifyService.getPlaylistsStats(playlistId).subscribe({
      next: (stats) => {
        this.playlistStats = stats;
      },
      error: (err) => console.error(err)
    });
  }

  private formatPlaylistResponse(response: SpotifyPlaylist): FormattedPlaylist {
    // Primero mapeamos los tracks existentes
    // Verificación adicional de seguridad
  if (!response || !response.tracks || !response.tracks.items) {
      console.error('Respuesta inválida:', response);
      return {
        id: '',
        name: 'Playlist no disponible',
        description: '',
        images: [],
        owner: { display_name: '' },
        followers: { total: 0 },
        tracks: {
          items: [],
          total: 0,
          limit: 0,
          offset: 0,
          next: null
        }
      };
    }

    const formattedTracks = response.tracks.items
      .filter(item => item.track) // Filtra items sin track
      .map((item, index) => ({
        position: index + 1,
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name),
        album: item.track.album.name,
        duration: this.formatDuration(item.track.duration_ms),
        previewUrl: item.track.preview_url || null,
        image: item.track.album.images[0]?.url || null
      }));

    return {
      id: response.id,
      name: response.name,
      description: response.description || '',
      images: response.images,
      owner: { display_name: response.owner.display_name },
      followers: response.followers,
      tracks: {
        items: formattedTracks,
        total: response.tracks.total,
        limit: response.tracks.limit,
        offset: response.tracks.offset,
        next: response.tracks.next
      }
    };
  }

  private scrollToPlaylistDetails(): void {
    setTimeout(() => {
      const element = document.getElementById('playlist-details');
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }
    }, 100);
  }

  private handlePlaylistError(err: any): string {
    if (err.status === 401) {
      return 'Tu sesión ha expirado. Por favor, vuelve a conectarte con Spotify.';
    } else if (err.status === 403) {
      return 'No tienes permisos para acceder a esta playlist.';
    } else if (err.status === 404) {
      return 'Playlist no encontrada.';
    } else {
      return 'Error al cargar los detalles de la playlist. Inténtalo de nuevo más tarde.';
    }
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${(+seconds < 10 ? '0' : '')}${seconds}`;
  }
  
playTrack(track: FormattedTrack): void {
  // Implementa la lógica para reproducir la canción completa
  console.log('Reproduciendo canción:', track.name);
}

togglePreview(track: FormattedTrack): void {
  if (!track.previewUrl) return;
  
  if (this.currentlyPlayingTrackId === track.id) {
    this.stopPreview();
  } else {
    this.playPreview(track);
  }
}

playPreview(track: FormattedTrack): void {
  this.stopPreview(); // Detener cualquier reproducción previa
  
  if (track.previewUrl) {
    this.currentAudio = new Audio(track.previewUrl);
    this.currentAudio.play();
    this.currentlyPlayingTrackId = track.id;
  }
}

isPlaying(track: FormattedTrack): boolean {
  return this.currentlyPlayingTrackId === track.id;
}

// loadMoreTracks(): void {
//     if (this.loadingMore || !this.selectedPlaylist || 
//       !this.selectedPlaylist.tracks.next || 
//       this.selectedPlaylist.tracks.items.length >= this.selectedPlaylist.tracks.total) {
//     return;
//   }

 
//     this.loadingMore = true;
//     const offset = this.selectedPlaylist.tracks.items.length;

//     this.spotifyService.getPlaylistTracks(this.selectedPlaylist.id, 50, offset)
//     .pipe(
//       finalize(() => this.loadingMore = false)
//     )
//     .subscribe({
//         next: (tracks) => {
//           if (this.selectedPlaylist) {
//             this.selectedPlaylist.tracks = {
//               items: [...this.selectedPlaylist.tracks.items, ...tracks.items],
//               total: tracks.total,
//               limit: tracks.limit,
//               offset: tracks.offset,
//               next: tracks.next
//             };
//           }
//         },
//       error: (err) => {
//         this.handleError(err);
//         this.loadingMore = false;
//       }
//     });
// }

loadMoreTracks(): void {
  // Verificar si ya está cargando o no hay más tracks
  if (this.loadingMore || this.allTracksLoaded || !this.selectedPlaylist) {
    return;
  }

  this.loadingMore = true;
  const currentOffset = this.selectedPlaylist.tracks.items.length;

  this.spotifyService.getPlaylistTracks(
    this.selectedPlaylist.id, 
    50, // Puedes ajustar este número
    currentOffset
  ).subscribe({
    next: (tracks) => {
      if (this.selectedPlaylist) {
      this.selectedPlaylist.tracks.items = [
        ...this.selectedPlaylist.tracks.items,
        ...tracks.items
      ];
      this.selectedPlaylist.tracks.total = tracks.total;
      this.allTracksLoaded = !tracks.next;
      this.loadingMore = false;
    }
  },
    error: (err) => {
      this.error = 'Error al cargar más canciones';
      this.loadingMore = false;
      console.error(err);
    }
  });
}

playTrackPreview(track: FormattedTrack): void {
  if (!track.previewUrl) return;
  
  this.stopPreview();
  this.currentAudio = new Audio(track.previewUrl);
  this.currentAudio.play();
  this.currentlyPlayingTrackId = track.id;
}

stopPreview(): void {
  if (this.currentAudio) {
    this.currentAudio.pause();
    this.currentAudio = null;
  }
  this.currentlyPlayingTrackId = null;
}

isTrackPlaying(trackId: string): boolean {
  return this.currentlyPlayingTrackId === trackId;
}

createChartOptions() {
  return {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Audio Features',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: this.playlistStats.audio_stats.avg_danceability * 100, name: 'Bailabilidad' },
          { value: this.playlistStats.audio_stats.avg_energy * 100, name: 'Energía' },
          { value: this.playlistStats.audio_stats.avg_valence * 100, name: 'Positividad' }
        ],
        label: {
          formatter: '{b}: {c}%'
        }
      }
    ]
  };
}

private handleError(error: any): void {
  console.error('Error:', error);
  this.error = error.message || 'Ocurrió un error';
  
  if (error.status === 401) {
    this.error = 'Tu sesión ha expirado. Por favor, vuelve a conectarte.';
    // Aquí podrías redirigir al login
  }
}
}