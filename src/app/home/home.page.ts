import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { meals } from 'src/app/data';
import { MealEntry, Meal } from 'src/app/utils';
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
  toastController = inject(ToastController);
  router = inject(Router);

  today = new Date();
  date = {
    day: this.today.getDate(),
    month: this.today.getMonth(),
    year: this.today.getFullYear()
  };

  currentMealEntry: MealEntry = {
    meal: null,
    count: 1,
    timestamp: this.today.getTime()
  };

  currentDateString = this.toInputDate(this.today);
  currentTimeString = this.toInputTime(this.today);

  isGraphMode = true;
  isModalOpen = false;

  selectedCategory: string | null = null;
  filteredMeals: Meal[] = [];

  categorizedMeals = this.getCategorizedMeals();

  
  onMainDateChange(event: any) {
    const selectedDateString = event.detail.value; 
    if (!selectedDateString) return;

    const parts = selectedDateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const day = parseInt(parts[2], 10);

    this.date = { day, month, year };
  }

  getCategorizedMeals() {
    const map: { [key: string]: Meal[] } = {};
    for (const meal of meals) {
      if (!map[meal.category]) map[meal.category] = [];
      map[meal.category].push(meal);
    }
    return Object.entries(map).map(([category, meals]) => ({ category, meals }));
  }

  onCategoryChange(event: any) {
    const category = event.detail.value;
    this.selectedCategory = category;
    this.filteredMeals = this.categorizedMeals.find(c => c.category === category)?.meals || [];
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (!isOpen) this.resetCurrentMealEntry();
  }

  resetCurrentMealEntry() {
    const now = new Date();
    this.currentMealEntry = {
      meal: null,
      count: 1,
      timestamp: now.getTime()
    };
    this.currentDateString = this.toInputDate(now);
    this.currentTimeString = this.toInputTime(now);
    this.selectedCategory = null;
    this.filteredMeals = [];
  }

  onDateChange(event: any) {
    this.currentDateString = event.detail.value;
    this.updateTimestampFromInputs();
  }

  onTimeChange(event: any) {
    this.currentTimeString = event.detail.value;
    this.updateTimestampFromInputs();
  }

  updateTimestampFromInputs() {
    const fullString = `${this.currentDateString}T${this.currentTimeString}`;
    this.currentMealEntry.timestamp = new Date(fullString).getTime();
  }

  toInputDate(date: Date): string {
    return `${date.getFullYear()}-${this.addZero(date.getMonth() + 1)}-${this.addZero(date.getDate())}`;
  }

  toInputTime(date: Date): string {
    return `${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}`;
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    toast.present();
  }

  async addMeal() {
    if (!this.currentMealEntry.meal || !this.currentMealEntry.count || !this.currentMealEntry.timestamp) return;

    await this.mealService.addMealEntry(
      this.currentMealEntry.meal.id,
      this.currentMealEntry.count,
      this.currentMealEntry.timestamp
    );

    this.presentToast('Yemek başarıyla eklendi!', 'success');
    this.setOpen(false);
  }

  async deleteMeal(mealId: number, timestamp: number) {
    await this.mealService.deleteMealEntry(mealId, timestamp);
    this.presentToast('Yemek silindi.', 'danger');
  }

  addZero(n: number): string {
    return n.toString().padStart(2, '0');
  }

  onSelectMeal(event: any) {
    const mealId = event.detail.value;
    const meal = meals.find((m) => m.id === mealId);
    if (meal) this.currentMealEntry.meal = meal;
  }

  getEntriesOfDate(entries: MealEntry[]): MealEntry[] {
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
        const meal = meals.find((m) => m.id === entry.meal?.id);
        return {
          ...entry,
          meal: meal || entry.meal
        };
      })
      .filter((entry) => entry.meal)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  createDateFrom(timestamp: number): Date {
    return new Date(timestamp);
  }

  getTotalPurine(entries: MealEntry[]): number {
    return entries.reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);
  }

  getComment(purine: number): string {
    if (purine < 300) return 'İyi gidiyorsun!';
    if (purine < 500) return 'Dikkatli olmalısın.';
    return 'Çok fazla pürin alındı!';
  }

  getWeeklyComment(weeklyPurine: number): string {
    if (weeklyPurine < 1500) return 'Harika gidiyorsun! Haftalık pürin oldukça düşük.';
    if (weeklyPurine < 2100) return 'İyi gidiyorsun ama dikkatli olmaya devam et.';
    return 'Bu hafta çok fazla pürin alındı! Daha dikkatli ol.';
  }

  getWeeklyNumberData(entries: MealEntry[]) {
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

  getWeeklyPurine(entries: MealEntry[]): number {
    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return entries
      .filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime())
      .reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(["/auth"]);
  }

  goSettings() {
    this.router.navigate(["/settings"]);
  }
}