import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyAuthService, SpotifyTokenResponse } from '../spotify-auth.service';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spotify-callback',
  template: `
    <div class="callback-container">
      <mat-spinner diameter="50" *ngIf="!error"></mat-spinner>
      <div *ngIf="error" class="error-message">
        <mat-icon>error_outline</mat-icon>
        <p>Error en la autenticación: {{error}}</p>
        <button mat-raised-button color="primary" (click)="retryLogin()">Reintentar</button>
      </div>
    </div>
  `,
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    CommonModule
  ]
  ,
  styleUrls: ['./spotify-callback.component.scss']
})
export class SpotifyCallbackComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  error: string | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private spotifyAuthService: SpotifyAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.handleSpotifyCallback();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleSpotifyCallback(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (params) => {
        const code = params['code'];
        const error = params['error'];

        if (error) {
          this.handleAuthError(params['error_description'] || 'Error desconocido de Spotify');
          return;
        }

        if (!code) {
          this.handleAuthError('No se recibió el código de autorización');
          return;
        }

        this.processAuthorizationCode(code);
      },
      error: (err) => this.handleAuthError('Error al leer parámetros de la URL')
    });
  }

  private processAuthorizationCode(code: string): void {
    this.spotifyAuthService.exchangeCodeForToken(code).pipe(
      tap((response) => {
        this.redirectToPlaylists();
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleAuthError(this.getErrorMessage(error));
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    ).subscribe(
      {
        next: () => {
          console.log('CallbackComponent: Suscripción a exchangeCodeForToken completada exitosamente.');
        },
        error: (err) => {
          console.error('CallbackComponent: Suscripción a exchangeCodeForToken terminó con error:', err); 
        }
      }
    );
  }

  private redirectToPlaylists(): void {
    this.router.navigate(['/playlists']).catch(() => {
      this.handleAuthError('No se pudo redirigir a la página de playlists');
    });
  }

  private handleAuthError(message: string): void {
    this.error = message;
    this.loading = false;
    this.spotifyAuthService.clearTokens();
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return 'Error de conexión';
    } else {
      return error.error?.error_description || error.error?.message || error.message || 'Error desconocido';
    }
  }

  retryLogin(): void {
    this.error = null;
    this.loading = true;
    this.spotifyAuthService.initiateAuthFlow();
  }
}