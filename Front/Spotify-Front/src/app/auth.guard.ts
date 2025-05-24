
import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core'; 
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SpotifyAuthService } from './spotify-auth.service';
import { Observable} from 'rxjs';
import { map, take, tap } from 'rxjs/operators'; 
import { isPlatformBrowser } from '@angular/common'; 

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private isBrowser: boolean;

  constructor(
    private authService: SpotifyAuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth();
  }

  checkAuth(): Observable<boolean> {

    return this.authService.isLoggedIn$.pipe(
      take(1), 
      tap(isLoggedIn => {
       
        if (this.isBrowser) { 
          if (isLoggedIn) {
            document.body.classList.add('no-background');
           
          } else {
            document.body.classList.remove('no-background');
            
            this.router.navigate(['/login']);
          }
        }
      }),
      map(isLoggedIn => {
        
        if (!this.isBrowser && !isLoggedIn) {
          return false; 
        }
        return isLoggedIn;
      })
    );
  }
}


export const authGuard: CanActivateFn = (next, state) => {
  return inject(AuthGuard).canActivate(next, state); 
};