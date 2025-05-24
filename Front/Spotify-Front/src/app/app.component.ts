import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PlaylistsComponent } from './playlists/playlists.component';
import { SpotifyLoginComponent } from './spotify-login/spotify-login.component';
import { SpotifyCallbackComponent } from './spotify-callback/spotify-callback.component';
import {MatTabsModule} from '@angular/material/tabs';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { SpotifyAuthService } from './spotify-auth.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    CommonModule,
    SpotifyLoginComponent,
    SpotifyCallbackComponent,
    PlaylistsComponent,
    MatTabsModule,
    NgxChartsModule,
    MatToolbarModule,
    MatIconModule,
     MatButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Spotify-Front';
  private authSubscription: Subscription | undefined;
  constructor(private router:Router, private spotifyAuthService: SpotifyAuthService){}
 
  ngAfterViewInit(): void {
    this.authSubscription = this.spotifyAuthService.isLoggedIn$.subscribe(isLoggedIn => {
    });
  }


  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  exitUser() {
   this.router.navigate(['login']);
  }
}
