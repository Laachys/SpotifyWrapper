import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenreChartComponent } from './components/genre-chart/genre-chart.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { TopArtistsComponent } from './components/top-artists/top-artists.component';
import { TopTracksComponent } from './components/top-tracks/top-tracks.component';
import { DashboardComponent } from './dashboard.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@NgModule({
  declarations: [
    
    DashboardComponent,
    ProfileCardComponent,
    GenreChartComponent,
    TopArtistsComponent,
    TopTracksComponent,
    RecentActivityComponent
  ],
  imports: [
    CommonModule,
    NgxChartsModule,
    MatProgressSpinnerModule
  ]
})
export class DashboardModule { }
