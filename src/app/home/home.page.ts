import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ScrollDetail } from '@ionic/angular';
import { DataType, Language, presentToast, ToastColors, User } from 'src/app/utils';
import { AuthService } from 'src/app/services/auth.service';
import { Meal, MealEntry, MealService } from 'src/app/services/meal.service';
import { CardComponent } from 'src/app/components/card/card.component';
import { Router } from '@angular/router';
import { WaterValue, WaterConsumption, WaterConsumptionService } from '../services/water_consumption';
import { ChartComponent } from '../components/chart.component';
import { WaterCardComponent } from '../components/water-consumption/water-consumption.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AddModalComponent } from '../components/add-modal/add-modal.component';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, ChartComponent, CardComponent, WaterCardComponent, AddModalComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  authService = inject(AuthService);
  mealService = inject(MealService);
  waterConsumptionService = inject(WaterConsumptionService);
  translateService = inject(TranslateService);
  toastController = inject(ToastController);
  router = inject(Router);

  DataType = DataType;
  WaterValue = WaterValue;

  today = new Date();
  date = {
    day: this.today.getDate(),
    month: this.today.getMonth(),
    year: this.today.getFullYear()
  };

  chartType: DataType;
  isInfoVisible = false;
  showStickyHeader = false;
  isModalOpen = false;

  changeChartType(type: DataType) {
    this.chartType = type;
  }

  onScroll(event: CustomEvent<ScrollDetail>) {
    if (event.detail.scrollTop > 50) {
      this.showStickyHeader = true;
    } else {
      this.showStickyHeader = false;
    }
  }

  toggleInfo() {
    this.isInfoVisible = !this.isInfoVisible;
  }

  onMainDateChange(event: any) {
    const selectedDateString = event.detail.value; 
    if (!selectedDateString) return;

    const parts = selectedDateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const day = parseInt(parts[2], 10);

    this.date = { day, month, year };
  }

  setModalOpen(value: boolean) {
    this.isModalOpen = value;

    if (!this.isModalOpen) {
      // this.resetCurrentMealEntries();
    }
  }

  async deleteMeal(mealId: number, timestamp: number) {
    await this.mealService.deleteMealEntry(mealId, timestamp);
    presentToast(this.toastController, "Yemek silindi.", ToastColors.DANGER);
  }

  getDateString(date: number, month: number, year: number) {
    return `${year}-${month.toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`;
  }

  getTimeString(hours: number, minutes: number) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  createDateFrom(timestamp: number): Date {
    return new Date(timestamp);
  }

  getEntriesOfDate(meals: Meal[], entries: MealEntry<Meal>[]): MealEntry<Meal>[] {
    return entries
      .filter((entry) => {
        const d = new Date(entry.timestamp);
        return (
          d.getDate() === this.date.day &&
          d.getMonth() === this.date.month &&
          d.getFullYear() === this.date.year
        );
      })
      .map((entry) => {
        const meal = (entry.meal && entry.meal.id > 0) ? meals.find((m) => m.id === entry.meal?.id) : entry.meal;
        return { ...entry, meal: meal || entry.meal };
      })
      .filter((entry) => entry.meal)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTotal(type: DataType, entries: MealEntry<Meal>[]): number {
    switch (type) {
      case DataType.PURINE: return entries.reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);
      case DataType.KCAL: return entries.reduce((sum, e) => sum + ((e.meal?.kcal || 0) * e.count), 0);
      case DataType.SUGAR: return entries.reduce((sum, e) => sum + ((e.meal?.sugar || 0) * e.count), 0);
    }
  }

  getWeeklyNumberData(user: User, entries: MealEntry<Meal>[]) {
    switch (user.language) {
      case Language.TURKISH: {
        const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
        const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
        monday.setDate(monday.getDate() - dayDiff);

        const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
        const mondayAt = monday.getTime();
        const sundayAt = sunday.getTime();
        const filtered = entries.filter((entry) => mondayAt <= entry.timestamp && entry.timestamp <= sundayAt);

        const values: number[][] = Array(7).fill(0).map(() => Array(3).fill(0));

        for (const entry of filtered) {
          if (entry.meal) {
            const day = (new Date(entry.timestamp)).getDay();
            const index = day === 0 ? 6 : day - 1;
            values[index][0] += (entry.meal.purine * entry.count);
            values[index][1] += (entry.meal.sugar * entry.count);
            values[index][2] += (entry.meal.kcal * entry.count);
          }
        }

        return values;
      }

      case Language.ENGLISH: {
        const sunday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
        sunday.setDate(sunday.getDate() - sunday.getDay());

        const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 7, 23, 59, 59, 999);
        const sundayAt = sunday.getTime();
        const saturdayAt = saturday.getTime();
        const filtered = entries.filter((entry) => sundayAt <= entry.timestamp && entry.timestamp <= saturdayAt);

        const values: number[][] = Array(7).fill(0).map(() => Array(3).fill(0));

        for (const entry of filtered) {
          if (entry.meal) {
            const day = (new Date(entry.timestamp)).getDay();
            values[day][0] += (entry.meal.purine * entry.count);
            values[day][1] += (entry.meal.sugar * entry.count);
            values[day][2] += (entry.meal.kcal * entry.count);
          }
        }

        return values;
      }
    }
  }

  getWeeklyTotal(type: DataType, entries: MealEntry<Meal>[]): number {
    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    switch (type) {
      case DataType.PURINE: return entries.filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime()).reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);
      case DataType.SUGAR: return entries.filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime()).reduce((sum, e) => sum + ((e.meal?.sugar || 0) * e.count), 0);
      case DataType.KCAL: return entries.filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime()).reduce((sum, e) => sum + ((e.meal?.kcal || 0) * e.count), 0);
    }
  }

  getDailyWater(waterConsumption: WaterConsumption[]) {
    const data = waterConsumption.filter((element) => {
      const date = new Date(element.timestamp / 1);
      return date.getDate() == this.date.day && date.getMonth() == this.date.month && date.getFullYear() == this.date.year;
    });

    const values = {
      [WaterValue.GLASS]: 330,
      [WaterValue.BOTTLE]: 500
    };

    return data.reduce((sum, element) => values[element.value] + sum, 0);
  }

  getWeeklyWater(waterConsumption: WaterConsumption[]) {
    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    const data = waterConsumption.filter((element) => {
      return monday.getTime() <= element.timestamp && element.timestamp <= sunday.getTime();
    });

    const values = {
      [WaterValue.GLASS]: 330,
      [WaterValue.BOTTLE]: 500
    };

    return data.reduce((sum, element) => values[element.value] + sum, 0);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(["/auth"]);
  }

  goSettings() {
    this.router.navigate(["/settings"]);
  }
}
