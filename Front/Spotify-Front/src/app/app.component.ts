import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlaylistsComponent } from './playlists/playlists.component';
import { SpotifyLoginComponent } from './spotify-login/spotify-login.component';
import { SpotifyCallbackComponent } from './spotify-callback/spotify-callback.component';
import {MatTabsModule} from '@angular/material/tabs';
import { NgxChartsModule } from '@swimlane/ngx-charts';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    CommonModule,       // para *ngIf, *ngFor...
    HttpClientModule,   // para inyectar HttpClient en servicios
    SpotifyLoginComponent,
    SpotifyCallbackComponent,
    PlaylistsComponent,
    MatTabsModule,
    NgxChartsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Spotify-Front';
}
