import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataType, MealEntry } from '../utils';
import { ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { IonicModule } from '@ionic/angular';

import { Chart } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, IonicModule],
  styles: [`
    .chart-card {
      background: white; 
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      padding: 10px;
      margin-top: 16px;
    }

    ion-card-content {
      height: 300px;
    }

    ion-card-title {
      color: #1e2023; 
      font-size: 1.2rem;
      font-weight: 700;
      padding-left: 6px;
    }

    canvas {
      height: 100% !important;
      width: 100% !important;
    }

    .empty-chart-state {
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        background: #f9f9f9;
        border-radius: 16px;
    }
  `],
  template: `
    <ion-card class="chart-card" *ngIf="chartData?.datasets[0]?.data?.length > 0">
      <ion-card-header>
        <ion-card-title>Haftalık Grafik</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <canvas baseChart
          [data]="chartData"
          [type]="chartType"
          [options]="chartOptions">
        </canvas>
      </ion-card-content>
    </ion-card>

    <div *ngIf="!chartData?.datasets[0]?.data?.length" class="empty-chart-state">
        Bu hafta için gösterilecek veri bulunmuyor.
    </div>
  `,
})
export class ChartComponent implements OnChanges {
  @Input() data: MealEntry[] = [];
  @Input() date?: { day: number; month: number; year: number };
  @Input() type: DataType;

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
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
          color: "#333" 
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
                label += ': ';
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

  private onLegendClick(e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    const ci = legend.chart;

    if (ci.isDatasetVisible(index)) {
      ci.hide(index);
      legendItem.hidden = true;
    } else {
      ci.show(index);
      legendItem.hidden = false;
    }
  }
 

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
        const dayIndex = new Date(entry.timestamp).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; 

        values[adjustedIndex][0] += (entry.meal.purine * entry.count);
        values[adjustedIndex][1] += (entry.meal.sugar * entry.count);
        values[adjustedIndex][2] += (entry.meal.kcal * entry.count);
    }
    
    this.chartData = {
      labels: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"], 
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
  }
}