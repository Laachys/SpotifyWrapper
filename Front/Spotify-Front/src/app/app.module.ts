// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AppComponent } from './app.component';
import { SpotifyLoginComponent  } from './spotify-login/spotify-login.component';
import { SpotifyCallbackComponent } from './spotify-callback/spotify-callback.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PlaylistsComponent } from './playlists/playlists.component';
import { ProfileCardComponent } from './dashboard/components/profile-card/profile-card.component';
import { RecentActivityComponent } from './dashboard/components/recent-activity/recent-activity.component';
import { TopArtistsComponent } from './dashboard/components/top-artists/top-artists.component';
import { TopTracksComponent } from './dashboard/components/top-tracks/top-tracks.component';
import { GenreChartComponent } from './dashboard/components/genre-chart/genre-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    SpotifyLoginComponent,  // ← aquí
    SpotifyCallbackComponent,
    DashboardComponent,
    PlaylistsComponent,
    ProfileCardComponent,
    RecentActivityComponent,
    TopArtistsComponent,
    TopTracksComponent,
    GenreChartComponent
    // otros componentes…
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxChartsModule
    // otros módulos (FormsModule, HttpClientModule, etc.)
  ],
  providers: [provideHttpClient(withFetch()),],
  bootstrap: [AppComponent]
})
export class AppModule { }
