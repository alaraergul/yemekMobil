
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { meals } from 'src/app/data';
import { MealEntry } from 'src/app/utils';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MealService } from 'src/app/services/meal/meal.service';
import { ChartComponent } from 'src/app/components/chart.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ChartComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  authService = inject(AuthService);
  mealService = inject(MealService);

  today = new Date();
  date = { day: this.today.getDate(), month: this.today.getMonth(), year: this.today.getFullYear() };

  currentMealEntry: MealEntry = {
    meal: null,
    count: 1,
    timestamp: this.today.getTime(),
  };

  isGraphMode = true;

  constructor(private router: Router) {}

  addZero(n: number): string {
    return n.toString().padStart(2, "0");
  }

  onDateInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    const date = new Date(input);
    this.date = { day: date.getDate(), month: date.getMonth(), year: date.getFullYear() };
  }

  onTimestampInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.currentMealEntry.timestamp = new Date(input).getTime();
  }

  onSelectMeal(event: Event) {
    const mealId = +(event.target as HTMLSelectElement).value;
    const meal = meals.find((m) => m.id === mealId);
    if (meal) this.currentMealEntry.meal = meal;
  }

  
  async addMeal() {
    await this.mealService.addMealEntry(
      this.currentMealEntry.meal.id,
      this.currentMealEntry.count,
      this.currentMealEntry.timestamp
    );

    this.currentMealEntry = {
      meal: null,
      count: null,
      timestamp: null
    };
  }

  async deleteMeal(mealId: number, timestamp: number) {
    await this.mealService.deleteMealEntry(mealId, timestamp);
  }

  getEntriesOfDate(entries: MealEntry[]): MealEntry[] {
    return entries.filter((entry) => {
      const d = new Date(entry.timestamp);
      return d.getDate() === this.date.day &&
        d.getMonth() === this.date.month &&
        d.getFullYear() === this.date.year;
    });
  }

  createDateFrom(timestamp: number): Date {
    return new Date(timestamp);
  }

  getTotalPurine(entries: MealEntry[]): number {
    return entries.reduce((sum, e) => sum + (e.meal.purine * e.count), 0);
  }

  getComment(purine: number): string {
    if (purine < 300) return 'İyi gidiyorsun!';
    if (purine < 500) return 'Dikkatli olmalısın.';
    return 'Çok fazla pürin alındı!';
  }

  getWeeklyNumberData(entries: MealEntry[]) {
    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);

    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    const mondayAt = monday.getTime();
    const sundayAt = sunday.getTime();

    const filtered = entries.filter((entry) => mondayAt <= entry.timestamp && entry.timestamp <= sundayAt);
    const values: (number[])[] = Array(7).fill(0).map((_) => Array(3).fill(0));

    for (const entry of filtered) {
      const day = (new Date(entry.timestamp)).getDay();
      values[day][0] += (entry.meal.purine * entry.count);
      values[day][1] += (entry.meal.sugar * entry.count);
      values[day][2] += (entry.meal.kcal * entry.count);
    }

    const data = values.slice(1);
    data.push(values[0]);

    return data;
  }

  getWeeklyPurine(entries: MealEntry[]): number {
    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);

    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    const mondayAt = monday.getTime();
    const sundayAt = sunday.getTime();

    return entries
      .filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime())
      .reduce((sum, e) => sum + e.meal.purine * e.count, 0);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(["/auth"]);
  }
}
