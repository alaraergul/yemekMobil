import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { meals } from 'src/app/data';
import { MealEntry, Meal, User, DataType } from 'src/app/utils';
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

  DataType = DataType;

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

  currentDateString = this.getDateString(this.date.day, this.date.month + 1, this.date.year);
  currentTimeString = `${this.today.getHours().toString().padStart(2, "0")}:${this.today.getMinutes().toString().padStart(2, "0")}`;

  isGraphMode = false;
  isModalOpen = false;

  selectedCategory: string | null = null;

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

  getCategoryNames(): string[] {
    const categories: string[] = [];

    for (const meal of meals) {
      if (!categories.includes(meal.category)) categories.push(meal.category);
    }

    return categories;
  }

  filterMeals() {
    return this.getCategorizedMeals().find(c => c.category === this.selectedCategory)?.meals || [];
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

    this.currentDateString = this.getDateString(now.getDate(), now.getMonth() + 1, now.getFullYear());
    this.currentTimeString = this.getTimeString(now.getHours(), now.getMinutes());
    this.selectedCategory = null;
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

  getDateString(date: number, month: number, year: number) {
    return `${year}-${month.toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`;
  }

  getTimeString(hours: number, minutes: number) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
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

  getTotal(type: DataType, entries: MealEntry[]): number {
    switch (type) {
      case DataType.PURINE:
        return entries.reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);

      case DataType.KCAL:
        return entries.reduce((sum, e) => sum + ((e.meal?.kcal || 0) * e.count), 0);

      case DataType.SUGAR:
        return entries.reduce((sum, e) => sum + ((e.meal?.sugar || 0) * e.count), 0);
    }
  }

  getComment(type: DataType, data: number, user: User): string {
    const limits = this.authService.getLimits(user);
    let name: string, limit: number;

    switch (type) {
      case DataType.PURINE:
        name = "pürin";
        limit = limits.purineLimit;
        break;

      case DataType.KCAL:
        name = "kalori";
        limit = limits.kcalLimit;
        break;

      case DataType.SUGAR:
        name = "şeker";
        limit = limits.sugarLimit;
        break;
    }

    if (data < (limit * 0.6)) return "İyi gidiyorsun!";
    if (data < limit) return `Dikkatli olmalısın, günlük ${name} alımının %60'ını doldurdun.`;
    return `Çok fazla ${name} adın!`;
  }

  getWeeklyComment(type: DataType, data: number, user: User): string {
    const limits = this.authService.getLimits(user);
    let name: string, limit: number;

    switch (type) {
      case DataType.PURINE:
        name = "pürin";
        limit = limits.purineLimit * 7;
        break;

      case DataType.KCAL:
        name = "kalori";
        limit = limits.kcalLimit * 7;
        break;

      case DataType.SUGAR:
        name = "şeker";
        limit = limits.sugarLimit * 7;
        break;
    }

    if (data < (limit * 0.6)) return `Harika gidiyorsun! Haftalık ${name} oldukça düşük.`;
    if (data < limit) return `İyi gidiyorsun ama dikkatli olmaya devam et, haftalık ${name} alımının %60'ını doldurdun.`;
    return `Bu hafta çok fazla ${name} alındı! Daha dikkatli ol.`;
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

  getWeeklyTotal(type: DataType, entries: MealEntry[]): number {
    const monday = new Date(this.date.year, this.date.month, this.date.day, 0, 0, 0, 0);
    const dayDiff = monday.getDay() != 0 ? (monday.getDay() - 1) : 6;
    monday.setDate(monday.getDate() - dayDiff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    switch (type) {
      case DataType.PURINE:
        return entries
          .filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime())
          .reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);

      case DataType.SUGAR:
        return entries
          .filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime())
          .reduce((sum, e) => sum + ((e.meal?.sugar || 0) * e.count), 0);

      case DataType.KCAL:
        return entries
          .filter(e => monday.getTime() <= e.timestamp && e.timestamp <= sunday.getTime())
          .reduce((sum, e) => sum + ((e.meal?.kcal || 0) * e.count), 0);
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(["/auth"]);
  }

  goSettings() {
    this.router.navigate(["/settings"]);
  }
}