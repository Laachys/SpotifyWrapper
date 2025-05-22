import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreChartComponent } from './genre-chart.component';

describe('GenreChartComponent', () => {
  let component: GenreChartComponent;
  let fixture: ComponentFixture<GenreChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenreChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
