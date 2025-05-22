import { Component, inject } from '@angular/core';
import { SpotifyAuthService } from '../spotify-auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
    MatCardModule, // Añade esto a tus imports
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './spotify-login.component.html',
  styleUrls: ['./spotify-login.component.scss'],
})
export class SpotifyLoginComponent {
  private authService = inject(SpotifyAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  constructor(private spotifyAuthService: SpotifyAuthService) {}

  
  /**
   * Verifica si hay un código de autorización en la URL
  //  */
  // private checkForAuthCode(): void {
  //   this.route.queryParams.subscribe(params => {
  //     const code = params['code'];
  //     if (code) {
  //       this.handleAuthCode(code);
  //     }
  //   });
  // }

  
  loginWithSpotify() {
    this.spotifyAuthService.initiateAuthFlow();
  }
}