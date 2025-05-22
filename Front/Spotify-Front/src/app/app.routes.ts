import { Routes } from '@angular/router';
import { PlaylistsComponent } from './playlists/playlists.component';
import { SpotifyCallbackComponent } from './spotify-callback/spotify-callback.component';
import { SpotifyLoginComponent } from './spotify-login/spotify-login.component';
import { authGuard } from './auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';


export const routes: Routes = [
    { path: 'login', component: SpotifyLoginComponent },
    { path: 'callback', component: SpotifyCallbackComponent },
    { path: 'playlists', component: PlaylistsComponent, canActivate: [authGuard], children: [
        { path: ':id', component: DashboardComponent } // Si el dashboard se muestra dentro
      ]
    },
    { path: 'authcallback', component: SpotifyCallbackComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
];
