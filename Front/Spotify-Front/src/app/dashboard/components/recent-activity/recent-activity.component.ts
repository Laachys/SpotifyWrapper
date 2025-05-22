import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  templateUrl: './recent-activity.component.html',
  imports:[CommonModule,
    NgxChartsModule],
  styleUrls: ['./recent-activity.component.scss']
})
export class RecentActivityComponent {
  @Input() plays: any[] = [];
  view: [number, number] = [800, 300];
  
  // Opciones del gráfico
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  autoScale = true;
  timeline = true;
  colorScheme: Color = {
  name: 'spotify',
  selectable: true,
  group: ScaleType.Ordinal,
  domain: ['#1DB954', '#191414', '#535353']
};

  formatData(): any[] {
    const playsByDate = this.plays.reduce((acc, play) => {
      const date = new Date(play.played_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return [{
      name: 'Reproducciones',
      series: Object.keys(playsByDate).map(date => ({
        name: date,
        value: playsByDate[date]
      }))
    }];
  }
}