import { ChangeDetectorRef, Component, inject, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonInput, ToastController } from '@ionic/angular';
import { Meal, MealCategory, MealEntry, MealService } from 'src/app/services/meal.service';
import { FormsModule } from '@angular/forms';
import { presentToast, ToastColors } from 'src/app/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule],
  styleUrls: ["./add-modal.component.scss"],
  templateUrl: "./add-modal.component.html",
})
export class AddModalComponent {
  @Input() isOpen: boolean;
  @Output() setOpen = new EventEmitter<boolean>(); 

  mealService = inject(MealService);
  toastController = inject(ToastController);
  translateService = inject(TranslateService);

  customMealMode = false;

  @ViewChild("searchInput", { static: false }) searchInput: IonInput;
  searchQuery?: string;
  searchResults: Meal[] = [];
  selectedCategory?: number;

  currentMealEntry: MealEntry = {
    meal: null,
    count: 1,
    timestamp: Date.now()
  };

  mealEntries: MealEntry[] = [];
  customMeal: Partial<Meal> = {
    name: null,
    purine: null,
    kcal: null,
    sugar: null,
    quantity: null
  };

  constructor(private cdr: ChangeDetectorRef) {}

  closeModal() {
    this.setOpen.emit(false);
  }

  async addMeal() {
    if (this.mealEntries.length === 0) {
      const message = await firstValueFrom(this.translateService.get("HOME.TOASTS.NO_MEAL_TO_SAVE"));
      presentToast(this.toastController, message, ToastColors.DANGER);
      return;
    }

    const result = await this.mealService.addMealEntries(this.mealEntries);

    if (result) {
      const message = await firstValueFrom(this.translateService.get("HOME.TOASTS.ADD_SUCCESS"));
      presentToast(this.toastController, message, ToastColors.SUCCESS);
      this.closeModal();
    } else {
      const message = await firstValueFrom(this.translateService.get("HOME.TOASTS.ADD_FAIL"));
      presentToast(this.toastController, message, ToastColors.DANGER);
    }
  }

  getCategoryNames(categories: MealCategory[]) {
    return categories.map((category, index) => ({"name": category.name, index})).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  createDateFrom(timestamp: number): Date {
    return new Date(timestamp);
  }

  resetCurrentMealEntry() {
    this.currentMealEntry = {
      meal: null,
      count: 1,
      timestamp: Date.now()
    };

    this.selectedCategory = null;
    this.searchQuery = null;
    this.searchResults = [];
    this.customMealMode = false;
    this.customMeal = { name: null, purine: null, kcal: null, sugar: null };
  }
  
  resetCurrentMealEntries() {
    this.mealEntries = [];
    this.resetCurrentMealEntry();
  }

  async pushMealEntry() {
    if (!this.currentMealEntry.meal || !this.currentMealEntry.count || this.currentMealEntry.count <= 0) {
      const message = await firstValueFrom(this.translateService.get("HOME.TOASTS.INVALID_MEAL_PORTION"));
      presentToast(this.toastController, message, ToastColors.DANGER);
      return;
    }
    this.mealEntries.push(JSON.parse(JSON.stringify(this.currentMealEntry)));
    const timestamp = this.currentMealEntry.timestamp;
    this.resetCurrentMealEntry();
    this.currentMealEntry.timestamp = timestamp;
    this.searchInput?.setFocus();
  }
  
  removeMealEntryFromList(index: number) {
    this.mealEntries.splice(index, 1);
  }

  onDateChange(event: CustomEvent) {
    const date = new Date(event.detail.value as string);
    date.setTime(date.getTime() + this.currentMealEntry.timestamp % (24 * 60 * 60 * 1000))
    this.currentMealEntry.timestamp = date.getTime();
  }

  onTimeChange(event: CustomEvent) {
    const data = (event.detail.value as string).split(":").map((value) => parseInt(value));
    const date = new Date(this.currentMealEntry.timestamp);
    date.setHours(data[0]);
    date.setMinutes(data[1]);
    this.currentMealEntry.timestamp = date.getTime();
  }

  async handleSearch(event: CustomEvent) {
    const value: string = event.detail.value;
    const meals = this.mealService.getAllMeals(await this.mealService.categories$);
    this.searchResults = meals.filter((meal) => meal.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()));
  }

  async onSelectMeal(event: CustomEvent) {
    const mealId: number = event.detail.value;
    const meals = this.mealService.getAllMeals(await this.mealService.categories$);

    const meal = meals.find((m) => m.id === mealId);
    if (meal) this.currentMealEntry.meal = meal;
  }

  selectSearchResult(categories: MealCategory[], meal: Meal) {
    this.selectedCategory = categories.findIndex((category) => category.name == meal.category);
    this.currentMealEntry.meal = meal;
    this.searchQuery = null;
    this.searchResults = [];
    this.customMealMode = false;
    this.cdr.detectChanges();
  }

  setCustomMealMode(state: boolean) {
    this.customMealMode = state;

    if (state) {
      this.searchQuery = null;
      this.searchResults = [];
      this.selectedCategory = null;
      this.currentMealEntry.meal = null;
    }
  } 

  async createAndSelectCustomMeal() {
    const { name, purine, sugar, kcal, quantity } = this.customMeal;

    if (!name || name.trim() === "" || purine === undefined || sugar == undefined || kcal == undefined || quantity == null || purine < 0 || sugar < 0 || kcal < 0 || quantity < 0) {
      const message = await firstValueFrom(this.translateService.get("HOME.TOASTS.CUSTOM_MEAL_INVALID"));
      presentToast(this.toastController, message, ToastColors.DANGER);
      return;
    } 

    const customMeal: Meal = {
      id: -Date.now(),
      name: name.trim(),
      purine: +purine,
      sugar: +sugar,
      kcal: +kcal,
      quantity: +quantity,
      category: "Özel Yemek"
    };

    this.currentMealEntry.meal = customMeal;
    this.setCustomMealMode(false); 
    this.customMeal = { name: '', purine: undefined, kcal: undefined, sugar: undefined }; 
  }
}