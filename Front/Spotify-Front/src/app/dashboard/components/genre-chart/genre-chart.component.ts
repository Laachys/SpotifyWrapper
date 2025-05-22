import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SPOTIFY_COLOR_SCHEME } from './../../../../styles/theme';
import { ScaleType, Color, LegendPosition } from '@swimlane/ngx-charts';



@Component({
  selector: 'app-genre-chart',
  standalone: true,
  templateUrl: './genre-chart.component.html',
  imports:[CommonModule,
    NgxChartsModule],
  styleUrls: ['./genre-chart.component.scss']
})
export class GenreChartComponent implements OnInit{
  // colorScheme = SPOTIFY_COLOR_SCHEME;

  @Input() genreData: any;
  view: [number, number] = [700, 400];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Género';
  showYAxisLabel = true;
  yAxisLabel = 'Número de Artistas';
  colorScheme = {
    name: 'genreScheme', // Un nombre para el esquema
    selectable: true,
    group: ScaleType.Ordinal, // Usamos ScaleType
    domain: ['#A8C686', '#71B046', '#CC5D3B', '#8F9988', '#5E4B56'] // Colores de ejemplo
  };

  legendPosition: LegendPosition = LegendPosition.Right;

  // ngOnChanges() {
  //   if (this.genreData) {
  //     this.processgenreData();
  //   }
  // }

  constructor() { }

  ngOnInit(): void { }

  processgenreData() {
    // Transformar datos para ngx-charts
    this.genreData = this.genreData.labels.map((label: string, index: number) => ({
      name: label,
      value: this.genreData.genreDatasets[0].genreData[index]
    }));
  }

  onSelect(event: any) {
    console.log('Item seleccionado', event);
  }
}