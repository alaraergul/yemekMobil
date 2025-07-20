import { Component, Input, OnChanges, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataType } from '../utils';
import { MealEntry } from '../services/meal/meal.service';
import { ChartConfiguration, ChartType, registerables, Chart } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, IonicModule, TranslateModule],
  styles: [`
    .chart-card { 
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      padding: 10px;
      margin-top: 16px;
    }
    ion-card-content {
      height: 200px;
    }
    ion-card-title {
      font-size: 1.2rem;
      font-weight: 700;
      padding-left: 6px;
    }
    canvas {
      height: 100% !important;
      width: 100% !important;
    }
    .empty-chart-state {
        text-align: center;
        padding: 40px 20px;
        border-radius: 16px;
        color: #888;
        background: white;
    }
  `],
  template: `
    @if (hasDataToShow) {
      <ion-card class="chart-card">
        <ion-card-header>
          <ion-card-title>{{ 'HOME.CHART.TITLE' | translate }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <canvas baseChart
            [data]="chartData"
            [type]="chartType"
            [options]="chartOptions">
          </canvas>
        </ion-card-content>
      </ion-card>
    } @else {
      <div class="empty-chart-state">
          {{ 'HOME.CHART.NO_DATA' | translate }}
      </div>
    }
  `,
})
export class ChartComponent implements OnChanges, OnInit {
  @Input() data: MealEntry[] = [];
  @Input() date?: { day: number; month: number; year: number };
  @Input() type: DataType;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  translate = inject(TranslateService);
  dayLabels: string[] = [];

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  chartType: ChartType = "line";

  chartOptions: ChartConfiguration<"line">["options"] = {
    backgroundColor: "#ff0000",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          font: { size: 13 },
          generateLabels: (chart) => {
            const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            originalLabels.forEach(label => {
              if (label.text === 'Pürin') {
                label.text = this.translate.instant('HOME.CHART.LABEL_PURINE');
              } else if (label.text === 'Şeker') {
                label.text = this.translate.instant('HOME.CHART.LABEL_SUGAR');
              }
            });
            return originalLabels;
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        callbacks: {
          label: ((context) => {
            let label = context.dataset.label || '';
            if (label) {
              let translatedLabel = '';
              if (label === 'Pürin') translatedLabel = this.translate.instant('HOME.CHART.LABEL_PURINE');
              else if (label === 'Şeker') translatedLabel = this.translate.instant('HOME.CHART.LABEL_SUGAR');
              else translatedLabel = label;
              label = translatedLabel + ': ';
            }
            if (context.parsed.y !== null) {
              const unit = context.dataset.label === 'kcal' ? 'kcal' : (context.dataset.label === 'Şeker' ? 'g' : 'mg');
              label += `${context.parsed.y.toLocaleString()} ${unit}`;
            }
            return label;
          })
        }
      }
    },
    scales: {
      x: {
        ticks: { font: { size: 12 }, color: "#666" },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 }, color: "#666" },
        grid: { color: "#E9E9E9" }
      }
    },
  };

  get hasDataToShow(): boolean {
    const data = this.chartData?.datasets[0]?.data;
    if (!data || data.length === 0) {
      return false;
    }
    return data.some(d => (d as number) > 0);
  }

  ngOnInit(): void {
    this.translate.onLangChange.subscribe(() => {
        this.ngOnChanges();
    });
  }
  
  ngOnChanges(): void {
    if (!this.data || !this.date) return;

    this.translate.get("HOME.CHART.DAYS_SHORT").subscribe(translations => {
        this.dayLabels = translations;
        const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
        const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
        monday.setDate(monday.getDate() - dayDiff);
        const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
        const mondayAt = monday.getTime();
        const sundayAt = sunday.getTime();
        const filtered = this.data.filter((entry) => mondayAt <= entry.timestamp && entry.timestamp <= sundayAt);
        const values: (number[])[] = Array(7).fill(0).map((_) => [0, 0, 0]);

        for (const entry of filtered) {
            if (!entry.meal) continue;
            const dayIndex = new Date(entry.timestamp).getDay();
            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            values[adjustedIndex][0] += (entry.meal.purine * entry.count);
            values[adjustedIndex][1] += (entry.meal.sugar * entry.count);
            values[adjustedIndex][2] += (entry.meal.kcal * entry.count);
        }

        this.chartData = {
          labels: this.dayLabels,
          datasets: []
        };

        switch (this.type) {
          case DataType.PURINE:
            this.chartData.datasets.push({
              data: values.map((value) => value[0]),
              label: "Pürin",
              borderColor: "#574BC0",
              backgroundColor: "rgba(87, 75, 192, 0.2)",
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#574BC0"
            });
            break;
          case DataType.SUGAR:
            this.chartData.datasets.push({
              data: values.map((value) => value[1]),
              label: "Şeker",
              borderColor: "#2DD36F",
              backgroundColor: "rgba(45, 211, 111, 0.2)",
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#2DD36F"
            });
            break;
          case DataType.KCAL:
            this.chartData.datasets.push({
              data: values.map((value) => value[2]),
              label: "kcal",
              borderColor: "#FFC409",
              backgroundColor: "rgba(255, 196, 9, 0.2)",
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#FFC409"
            });
            break;
        }
        
        this.chart?.update();
    });
  }
}