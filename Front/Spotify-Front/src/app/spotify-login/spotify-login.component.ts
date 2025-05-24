import { Component, Inject, inject, PLATFORM_ID } from '@angular/core';
import { SpotifyAuthService } from '../spotify-auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';

@Component({
  selector: 'app-spotify-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule, 
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './spotify-login.component.html',
  styleUrls: ['./spotify-login.component.scss'],
})
export class SpotifyLoginComponent {
  private isBrowser: boolean;
  constructor(private spotifyAuthService: SpotifyAuthService,@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId); 
  }

  
  loginWithSpotify() {
    this.spotifyAuthService.initiateAuthFlow();
  }

   ngOnInit(): void {
    if (this.isBrowser) { 
      document.body.classList.remove('no-background');
    } 
  }
}