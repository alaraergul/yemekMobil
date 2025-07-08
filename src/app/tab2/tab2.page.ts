
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { meals } from 'src/app/data';
import { Meal, MealEntry } from 'src/app/utils';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ChartComponent } from 'src/app/components/chart.component';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ChartComponent],
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss']
})
export class Tab2Page {
  authService = inject(AuthService);

  today = new Date();
  date = { day: this.today.getDate(), month: this.today.getMonth(), year: this.today.getFullYear() };

  currentMealEntry: MealEntry = {
    meal: meals[0],
    count: 1,
    timestamp: this.today.getTime(),
  };

  addZero(n: number): string {
    return n < 10 ? '0' + n : '' + n;
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

  addMeal() {
    this.authService.addEntry(this.currentMealEntry);
    this.currentMealEntry = { meal: meals[0], count: 1, timestamp: this.today.getTime() };
  }

  deleteMeal(mealId: number, timestamp: number) {
    this.authService.deleteEntry(mealId, timestamp);
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

  getWeeklyPurine(entries: MealEntry[]): number {
    const now = new Date();
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return entries
      .filter(e => new Date(e.timestamp) >= oneWeekAgo)
      .reduce((sum, e) => sum + e.meal.purine * e.count, 0);
  }

  getWeeklyComment(entries: MealEntry[]): string {
    const total = this.getWeeklyPurine(entries);
    if (total < 2000) return 'Haftalık alım oldukça iyi.';
    if (total < 3500) return 'Dengeli ama sınırda.';
    return 'Haftalık alım fazla!';
  }

  getAllMeals(): Meal[] {
    return meals;
  }

  logout() {
    this.authService.logout();
  }
}
