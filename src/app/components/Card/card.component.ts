import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataType, MealEntry, Risk, User } from '../../utils';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth/auth.service';
import { ChartComponent } from '../chart.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"]
})
export class CardComponent {
  @Input() data: MealEntry[];
  @Input() date: {day: number, month: number, year: number};

  @Input() type: DataType;
  @Input() user: User;
  @Input() title: string;
  @Input() dailyConsumption: number;
  @Input() weeklyConsumption: number;
  @Input() dailyLimit: number;
  @Input() chartType: DataType;
  @Output() changeChartType = new EventEmitter<DataType>();

  authService = inject(AuthService);
  DataType = DataType;

  getDailyLimit() {
    const limits = this.authService.getLimits(this.user);

    switch (this.type) {
      case DataType.PURINE:
        return limits.purineLimit;

      case DataType.KCAL:
        return limits.kcalLimit;

      case DataType.SUGAR:
        return limits.sugarLimit;

      default:
        break;
    }
  }

  getRisk(type: DataType, data: number, multiplier: number) {
    const limits = this.authService.getLimits(this.user);
    let limit: number;

    switch (type) {
      case DataType.PURINE:
        limit = limits.purineLimit * multiplier;
        break;

      case DataType.KCAL:
        limit = limits.kcalLimit * multiplier;
        break;

      case DataType.SUGAR:
        limit = limits.sugarLimit * multiplier;
        break;
    }

    if (data < (limit * 0.85)) return Risk.LOW;
    if (data < limit) return Risk.MEDIUM;
    return Risk.HIGH;
  }

  getComment(risk: Risk): string {
    switch (risk) {
      case Risk.LOW:
        return "Tüketimin oldukça düşük.";

      case Risk.MEDIUM:
        return "Limitinin %85'ini doldurdun.";

      case Risk.HIGH:
        return "Limiti aştın!";
    }
  }

  getIcon(risk: Risk): string {
    switch (risk) {
      case Risk.LOW:
        return "checkmark-circle-outline";

      case Risk.MEDIUM:
        return "alert-circle-outline";

      case Risk.HIGH:
        return "close-circle-outline";
    }
  }

  getColor(risk: Risk): string {
    switch (risk) {
      case Risk.LOW:
        return "green";

      case Risk.MEDIUM:
        return "orange";

      case Risk.HIGH:
        return "red";
    }
  }
}