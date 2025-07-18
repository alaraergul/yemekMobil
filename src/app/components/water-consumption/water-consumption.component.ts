import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Risk, User, WaterValue } from '../../utils';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth/auth.service';
import { WaterConsumptionService } from 'src/app/services/water_consumption/water_consumption';

@Component({
  selector: 'app-water-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: "./water-consumption.component.html",
  styleUrls: ["../card/card.component.scss", "./water-consumption.component.scss"]
})
export class WaterCardComponent {
  @Input() date: {day: number, month: number, year: number};

  @Input() user: User;
  @Input() dailyConsumption: number;
  @Input() weeklyConsumption: number;

  authService = inject(AuthService);
  waterConsumptionService = inject(WaterConsumptionService);
  WaterValue = WaterValue;

  async consumeWater(value: WaterValue) {
    return this.waterConsumptionService.addWaterConsumption(value);
  }

  getDailyLimit() {
    return this.authService.getLimits(this.user).waterLimit;
  }

  getRisk(data: number, multiplier: number) {
    const limit = this.getDailyLimit() * multiplier;

    if (data < (limit * 0.5)) return Risk.HIGH;
    if (data < (limit * 0.8)) return Risk.MEDIUM;
    return Risk.LOW;
  }

  getComment(risk: Risk): string {
    switch (risk) {
      case Risk.HIGH:
        return "Tüketimin oldukça düşük.";

      case Risk.MEDIUM:
        return "Az su içtin.";

      case Risk.LOW:
        return "Gayet iyi.";
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