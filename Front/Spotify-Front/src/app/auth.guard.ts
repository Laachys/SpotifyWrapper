import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SpotifyAuthService } from './spotify-auth.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(private authService: SpotifyAuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.checkAuth();
  }

  checkAuth(): Observable<boolean> {
    if (this.authService.isLoggedIn()) {
      return of(true);
    } else {
      this.router.navigate(['/login']);
      return of(false);
    }
  }
}

export const authGuard: CanActivateFn = () => {
  return inject(AuthGuard).canActivate();
};