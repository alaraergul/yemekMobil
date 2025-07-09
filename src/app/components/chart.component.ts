import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealEntry } from '../utils';
import { ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { IonicModule } from '@ionic/angular';;

import { Chart } from 'chart.js';
Chart.register(...registerables); 

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, IonicModule],
  styles: [`
    ion-card-content {
      height: 280px; 
    }

    canvas {
      height: 100% !important;
      width: 100% !important;
    }

    @media (min-width: 768px) {
      ion-card-content {
        height: 320px;
      }
    }
  `],
  template: `
    <ion-card *ngIf="chartData?.datasets[0]?.data?.length">
      <ion-card-header>
        <ion-card-title>📈 Pürin Alım Grafiği</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <canvas baseChart
          [data]="chartData"
          [type]="chartType"
          [options]="chartOptions">
        </canvas>
      </ion-card-content>
    </ion-card>

    <ion-card *ngIf="!chartData?.datasets[0]?.data?.length">
      <ion-card-content>
        Bugün için gösterilecek pürin verisi yok.
      </ion-card-content>
    </ion-card>
  `,
})
export class ChartComponent implements OnChanges {
  @Input() data: MealEntry[] = [];
  @Input() date?: { day: number; month: number; year: number };

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: "Pürin Alımı (mg)",
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  chartType: ChartType = "line";

  chartOptions: ChartConfiguration<"line">["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 13 },
          color: "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.formattedValue} mg`,
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 } },
      },
    },
  };

  ngOnChanges(): void {
    if (!this.data || !this.date) return;

    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);

    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    const mondayAt = monday.getTime();
    const sundayAt = sunday.getTime();

    const filtered = this.data.filter((entry) => mondayAt <= entry.timestamp && entry.timestamp <= sundayAt);
    const values: (number[])[] = Array(7).fill(0).map((_) => [0, 0, 0]);

    for (const entry of filtered) {
      const day = (new Date(entry.timestamp)).getDay();
      values[day][0] += (entry.meal.purine * entry.count);
      values[day][1] += (entry.meal.sugar * entry.count);
      values[day][2] += (entry.meal.kcal * entry.count);
    }

    const data = values.slice(1);
    data.push(values[0]);

    this.chartData = {
      labels: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
      datasets: [
        {
          data: data.map((value) => value[0]),
          label: "Pürin",
          borderColor: "rgba(75,192,192,1)",
          backgroundColor: "rgba(75,192,192,0.2)",
          fill: true,
          tension: 0.3,
        },
        {
          data: data.map((value) => value[1]),
          label: "Şeker",
          borderColor: "rgb(79, 192, 75)",
          backgroundColor: "rgba(79, 192, 75, 0.2)",
          fill: true,
          tension: 0.3,
        },
        {
          data: data.map((value) => value[2]),
          label: "kcal",
          borderColor: "rgb(192, 75, 75)",
          backgroundColor: "rgba(192, 75, 75, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }

  zero(n: number): string {
    return n.toString().padStart(2, "0");
  }
}

