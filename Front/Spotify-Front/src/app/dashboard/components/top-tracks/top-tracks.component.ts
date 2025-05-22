import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-top-tracks',
  standalone: true,
  templateUrl: './top-tracks.component.html',
  styleUrls: ['./top-tracks.component.scss'],
  imports:[CommonModule]
})
export class TopTracksComponent {
  @Input() tracks: any[] = [];
  
}
