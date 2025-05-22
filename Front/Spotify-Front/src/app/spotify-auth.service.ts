import { Inject, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private backendUrl = environment.backendUrl;
  // public currentUser: string | null = null;
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<{ id?: string, display_name?: string, images?: any[] } | null>(null);
 public user$: Observable<{ id?: string, display_name?: string, images?: any[] } | null> = this.userSubject.asObservable();
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('spotify_user');
      if (storedUser) {
        try {
          this.userSubject.next(JSON.parse(storedUser));
          this.userSubject.forEach(element => {
            console.log(element);
          });
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          localStorage.removeItem('spotify_user'); // Limpiar datos corruptos
        }
      }
    }
  }


  initiateLogin() {
    window.location.href = `${this.backendUrl}/login`;
  }

  handleCallback(code: string) {
    return this.http.get(`${this.backendUrl}/callback`, { params: { code } });
  }
  /**
   * Inicia el flujo de autenticación con Spotify
   */
  initiateAuthFlow() {
    window.location.href = `${this.backendUrl}/login`;
    
  }

  /**
   * Intercambia el código de autorización por tokens
   */
  exchangeCodeForToken(code: string): Observable<any> {
    return this.http.get<SpotifyTokenResponse & { user_profile?: any }>(
      `${this.backendUrl}/callback?code=${code}`
    ).pipe(
       tap(response => {
        this.storeTokens(response); // Guarda tokens

        // Si el backend devuelve el perfil del usuario directamente, úsalo
        if (response.user_profile) {
          this.userSubject.next(response.user_profile);
          this.safeLocalStorage()?.setItem('spotify_user', JSON.stringify(response.user_profile));
        } else if (response.display_name) {
          // Si solo devuelve display_name, actualiza solo eso (menos ideal, mejor el perfil completo)
          this.userSubject.next({ display_name: response.display_name });
          this.safeLocalStorage()?.setItem('spotify_user', JSON.stringify({ display_name: response.display_name }));
        }
      }),
      catchError(error => {
        console.error('Error exchanging code for token:', error);
        return throwError(() => new Error('Failed to exchange code for token'));
      })
    );
  }

  /**
   * Refresca el token de acceso
   */
  refreshToken(): Observable<SpotifyTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<SpotifyTokenResponse>(
      `${this.backendUrl}/refresh_token`,
      { refreshToken }
    ).pipe(
      tap(response => this.storeTokens(response)),
      catchError(error => {
        console.error('Error refreshing token:', error);
        this.clearTokens();
        return throwError(() => new Error('Failed to refresh token'));
      })
    );
  }

  /**
   * Almacena los tokens en el localStorage
   */
  private storeTokens(response: SpotifyTokenResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_access_token', response.access_token);
      localStorage.setItem('spotify_refresh_token', response.refresh_token);
      localStorage.setItem('spotify_token_expires_at', (Date.now() + (response.expires_in * 1000)).toString());
    }
  }

  /**
   * Elimina todos los tokens del almacenamiento
   */
  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expires_at');
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spotify_access_token');
    }
    return null;
  }

  setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_access_token', token);
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spotify_refresh_token');
    }
    return null;
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_refresh_token', token);
    }
  }

  getExpirationTime(): number | null {
    if (typeof window !== 'undefined') {
      const expirationTime = localStorage.getItem('spotify_token_expires_at');
      return expirationTime ? parseInt(expirationTime, 10) : null;
    }
    return null;
  }

  setExpirationTime(expiresIn: number): void {
    if (typeof window !== 'undefined') {
      const expirationTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem('spotify_token_expires_at', expirationTime.toString());
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      const accessToken = this.getAccessToken();
      const expirationTime = this.getExpirationTime();
      return !!accessToken && !!expirationTime && expirationTime > Date.now();
    }
    return false;
  }

  /**
   * Actualiza todos los tokens a la vez
   */
   updateTokens(response: SpotifyTokenResponse): void {
    // this.storeTokens(response); // Esta función privada es la que guarda en localStorage
    this.accessTokenSubject.next(response.access_token);
    
    // Guarda también el nombre del usuario
    this.userSubject.next({
      display_name: response.display_name
    });

   const storage = this.safeLocalStorage();
    if (storage) {  // ✅ Verifica si está disponible
      storage.setItem('spotify_user', JSON.stringify({
        display_name: response.display_name
      }));
    }
  }


  // Método seguro para usar localStorage
  private safeLocalStorage(): Storage | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage;  // ✅ Solo se ejecuta en el navegador
    }
    return null;
  }

  getDisplayName(): string | undefined {
    return this.userSubject.value?.display_name;
  }
  
  /**
   * Cierra la sesión limpiando los tokens y redirigiendo al login
   */
  logout(): void {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  // public getUser(): string | null {
  //   return this.currentUser;
  // }
}


// export class SpotifyAuthService {
//   private backendUrl = environment.backendUrl;


//   initiateLogin() {
//     window.location.href = `${this.backendUrl}/login`;
//   }

//   handleCallback(code: string) {
//     return this.http.get(`${this.backendUrl}/callback`, { params: { code } });
//   }
// }

export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
  display_name?: string;
  user_profile?: string;
}