
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core'; 
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ScaleType } from '@swimlane/ngx-charts';


@Component({
  selector: 'app-genre-chart',
  standalone: true,
  templateUrl: './genre-chart.component.html',
  imports:[CommonModule, NgxChartsModule],
  styleUrls: ['./genre-chart.component.scss']
})
export class GenreChartComponent{ 

  @Input() genreData: any; 
  
  view: [number, number] = [1000, 300];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Género';
  showYAxisLabel = true;
  yAxisLabel = 'Número de Artistas';
  colorScheme = {
    name: 'genreScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1DB954','#7DCF99', '	#232723', '	#e1ece3', '#457e59', '	#a8b2a8']
  };

  constructor() { }

  onSelect(event: any) {
    console.log('Item seleccionado', event);
  }
}