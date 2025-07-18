import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonInput, ToastController, ScrollDetail } from '@ionic/angular';
import { MealEntry, Meal, User, DataType, Risk, WaterValue, WaterConsumption, MealCategory } from 'src/app/utils';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MealService } from 'src/app/services/meal/meal.service';
import { CardComponent } from 'src/app/components/card/card.component';
import { Router } from '@angular/router';
import { WaterConsumptionService } from '../services/water_consumption/water_consumption';
import { ChartComponent } from '../components/chart.component';
import { WaterCardComponent } from '../components/water-consumption/water-consumption.component';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ChartComponent, CardComponent, WaterCardComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  authService = inject(AuthService);
  mealService = inject(MealService);
  waterConsumptionService = inject(WaterConsumptionService);
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

  mealEntries: MealEntry[] = [];

  currentMealEntry: MealEntry = {
    meal: null,
    count: 1,
    timestamp: this.today.getTime()
  };

  currentDateString: string;
  currentTimeString: string;
  chartType: DataType;
  isInfoVisible = false;
  showStickyHeader = false;

  @ViewChild("searchInput", { static: false }) searchInput: IonInput;
  isModalOpen = false;
  searchQuery: string;
  searchResults: Meal[] = [];
  selectedCategory: string | null = null;

  isCreatingNewMeal = false;
  newCustomMeal: Partial<Meal> = {
    name: '',
    purine: undefined,
    kcal: undefined,
    sugar: undefined,
  };

  constructor(private cdr: ChangeDetectorRef) {
    this.resetCurrentMealEntry();
  }

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

  selectSearchResult(meal: Meal) {
    this.selectedCategory = meal.category;
    this.currentMealEntry.meal = meal;
    this.searchQuery = null;
    this.searchResults = [];
    this.isCreatingNewMeal = false;
    this.cdr.detectChanges();
  }

  async handleSearch(event: CustomEvent) {
    const value: string = event.detail.value;
    const meals = this.mealService.getAllMeals(await this.mealService.categories$);

    this.searchResults = meals.filter((meal) => meal.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
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

  getCategoryNames(categories: MealCategory[]): string[] {
    return categories.map((category) => category.name).sort((a, b) => a.localeCompare(b, 'tr'));
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (!isOpen) {
      this.resetCurrentMealEntries();
    }
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
    this.searchQuery = '';
    this.searchResults = []; 
    this.isCreatingNewMeal = false; 
    this.newCustomMeal = { name: '', 
      purine: undefined, 
      kcal: undefined, 
      sugar: undefined }; 
  }
  
  resetCurrentMealEntries() {
    this.mealEntries = [];
    this.resetCurrentMealEntry();
  }

  pushMealEntry() {
    if (!this.currentMealEntry.meal || !this.currentMealEntry.count || this.currentMealEntry.count <= 0) {
      this.presentToast('Lütfen geçerli bir yemek seçin ve porsiyonu girin.', 'danger');
      return;
    }
    
    this.updateTimestampFromInputs(); 

    this.mealEntries.push(JSON.parse(JSON.stringify(this.currentMealEntry)));

    const timestamp = this.currentMealEntry.timestamp; 
    this.resetCurrentMealEntry();
    this.currentMealEntry.timestamp = timestamp; 
    this.updateStringInputsFromTimestamp();

    this.searchInput?.setFocus();
  }
  
  removeMealEntryFromList(index: number) {
    this.mealEntries.splice(index, 1);
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
    if (this.currentDateString && this.currentTimeString) {
      const fullString = `${this.currentDateString}T${this.currentTimeString}`;
      this.currentMealEntry.timestamp = new Date(fullString).getTime();
    }
  }

  updateStringInputsFromTimestamp() {
      const date = new Date(this.currentMealEntry.timestamp);
      this.currentDateString = this.getDateString(date.getDate(), date.getMonth() + 1, date.getFullYear());
      this.currentTimeString = this.getTimeString(date.getHours(), date.getMinutes());
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'top',
      color
    });
    toast.present();
  }

  async addMeal() {
    if (this.mealEntries.length === 0) {
      this.presentToast('Kaydedilecek yemek bulunmuyor. Lütfen önce listeye ekleyin.', 'danger');
      return;
    }

    const result = await this.mealService.addMealEntries(this.mealEntries);

    if (result) {
      this.presentToast('Yemekler başarıyla eklendi!', 'success');
      this.setOpen(false);
    } else {
      this.presentToast('Yemekler eklenirken bir hata oluştu.', 'danger');
    }
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

  async onSelectMeal(event: any) {
    const mealId = event.detail.value;
    const meals = this.mealService.getAllMeals(await this.mealService.categories$);

    const meal = meals.find((m) => m.id === mealId);
    if (meal) this.currentMealEntry.meal = meal;
  }

   toggleCreateNewMealView(state: boolean) {
    this.isCreatingNewMeal = state;
    if (state) {
      this.searchQuery = '';
      this.searchResults = [];
      this.selectedCategory = null;
      this.currentMealEntry.meal = null;
    }
  } 

  createAndSelectCustomMeal() {
    const { name, purine, sugar, kcal } = this.newCustomMeal;
    
    if (!name || name.trim() === '' || purine === undefined || sugar === undefined || kcal === undefined || purine < 0 || sugar < 0 || kcal < 0) {
        this.presentToast('Lütfen tüm alanları geçerli değerlerle doldurun.', 'danger');
        return;
    } 

    const customMeal: Meal = {
        id: -Date.now(),
        name: name.trim(),
        purine: +purine,
        sugar: +sugar,
        kcal: +kcal,
        quantity: 1,
        category: 'Özel Yemek'
    };
    this.currentMealEntry.meal = customMeal;
    this.toggleCreateNewMealView(false); 
    this.newCustomMeal = { name: '', purine: undefined, kcal: undefined, sugar: undefined }; 
  }

  getEntriesOfDate(meals: Meal[], entries: MealEntry[]): MealEntry[] {
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

  createDateFrom(timestamp: number): Date {
    return new Date(timestamp);
  }

  getTotal(type: DataType, entries: MealEntry[]): number {
    switch (type) {
      case DataType.PURINE: return entries.reduce((sum, e) => sum + ((e.meal?.purine || 0) * e.count), 0);
      case DataType.KCAL: return entries.reduce((sum, e) => sum + ((e.meal?.kcal || 0) * e.count), 0);
      case DataType.SUGAR: return entries.reduce((sum, e) => sum + ((e.meal?.sugar || 0) * e.count), 0);
    }
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