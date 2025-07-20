import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataType, Risk, User } from '../../utils';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Meal, MealEntry } from 'src/app/services/meal.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"]
})
export class CardComponent implements OnInit {
  @Input() data: MealEntry<Meal>[];
  @Input() date: {day: number, month: number, year: number};

  @Input() type: DataType;
  @Input() title: string;
  @Input() dailyConsumption: number;
  @Input() weeklyConsumption: number;
  @Input() chartType: DataType;
  @Output() changeChartType = new EventEmitter<DataType>();

  authService = inject(AuthService);
  translateService = inject(TranslateService);

  DataType = DataType;
  user: User;

  async ngOnInit() {
    this.user = await this.authService.user$;
  }

  getDailyLimit() {
    if (!this.user) return;

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

  getRisk(data: number, multiplier: number) {
    const limit = this.getDailyLimit() * multiplier;

    if (data < (limit * 0.85)) return Risk.LOW;
    if (data < limit) return Risk.MEDIUM;
    return Risk.HIGH;
  }

  getComment(risk: Risk): Observable<string> {
    switch (risk) {
      case Risk.LOW:
        return this.translateService.get("CARD.LOW_RISK");

      case Risk.MEDIUM:
        return this.translateService.get("CARD.MEDIUM_RISK");

      case Risk.HIGH:
        return this.translateService.get("CARD.HIGH_RISK");
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