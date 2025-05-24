
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core'; // Importa OnChanges, SimpleChanges, ElementRef, HostListener
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  templateUrl: './recent-activity.component.html',
  imports:[CommonModule, NgxChartsModule],
  styleUrls: ['./recent-activity.component.scss']
})
export class RecentActivityComponent implements OnChanges { 

  @Input() recentPlaysData: any[] = []; 



  // Opciones del gráfico
  showXAxis = true;
  showYAxis = true;
  gradient = false; 
  showLegend = true; 
  showXAxisLabel = true;
  showYAxisLabel = true;
  showLabels = true;
  timeline = true; 
  xAxisLabel = 'Hora del día'; 
  yAxisLabel = 'Reproducciones';

  colorScheme: Color = {
    name: 'multiLineActivity',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1DB954','#7DCF99', '	#232723', '	#e1ece3', '#457e59', '	#a8b2a8']
  };

  constructor() { } 
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recentPlaysData'] && changes['recentPlaysData'].currentValue) {
      this.recentPlaysData = [...changes['recentPlaysData'].currentValue]; 
    }
  }

  onSelect(event: any): void {
    console.log('Item seleccionado:', event);
  }
}