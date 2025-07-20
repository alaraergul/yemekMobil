import { ChangeDetectorRef, Component, inject, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonInput, ToastController } from '@ionic/angular';
import { Meal, MealCategory, MealEntry, MealService } from 'src/app/services/meal/meal.service';
import { FormsModule } from '@angular/forms';
import { presentToast, ToastColors } from 'src/app/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  translate = inject(TranslateService);

  isCreatingNewMeal = false;

  @ViewChild("searchInput", { static: false }) searchInput: IonInput;
  searchQuery?: string;
  searchResults: Meal[] = [];
  selectedCategory?: string;

  currentMealEntry: MealEntry = {
    meal: null,
    count: 1,
    timestamp: Date.now()
  };

  mealEntries: MealEntry[] = [];
  newCustomMeal: Partial<Meal> = {
    name: '',
    purine: undefined,
    kcal: undefined,
    sugar: undefined,
  };

  constructor(private cdr: ChangeDetectorRef) {}

  closeModal() {
    this.setOpen.emit(false);
  }

  async addMeal() {
    if (this.mealEntries.length === 0) {
      const message = await this.translate.get("HOME.TOASTS.NO_MEAL_TO_SAVE").toPromise();
      presentToast(this.toastController, message, ToastColors.DANGER);
      return;
    }
    const result = await this.mealService.addMealEntries(this.mealEntries);
    if (result) {
      const message = await this.translate.get("HOME.TOASTS.ADD_SUCCESS").toPromise();
      presentToast(this.toastController, message, ToastColors.SUCCESS);
      this.closeModal();
    } else {
      const message = await this.translate.get("HOME.TOASTS.ADD_FAIL").toPromise();
      presentToast(this.toastController, message, ToastColors.DANGER);
    }
  }

  getCategoryNames(categories: MealCategory[]): string[] {
    return categories.map((category) => category.name).sort((a, b) => a.localeCompare(b, 'tr'));
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
    this.isCreatingNewMeal = false;
    this.newCustomMeal = { name: null, purine: null, kcal: null, sugar: null };
  }
  
  resetCurrentMealEntries() {
    this.mealEntries = [];
    this.resetCurrentMealEntry();
  }

  async pushMealEntry() {
    if (!this.currentMealEntry.meal || !this.currentMealEntry.count || this.currentMealEntry.count <= 0) {
      const message = await this.translate.get("HOME.TOASTS.INVALID_MEAL_PORTION").toPromise();
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

  selectSearchResult(meal: Meal) {
    this.selectedCategory = meal.category;
    this.currentMealEntry.meal = meal;
    this.searchQuery = null;
    this.searchResults = [];
    this.isCreatingNewMeal = false;
    this.cdr.detectChanges();
  }

  toggleCreateNewMealView(state: boolean) {
    this.isCreatingNewMeal = state;
    if (state) {
      this.searchQuery = null;
      this.searchResults = [];
      this.selectedCategory = null;
      this.currentMealEntry.meal = null;
    }
  } 

  async createAndSelectCustomMeal() {
    const { name, purine, sugar, kcal } = this.newCustomMeal;
    if (!name || name.trim() === '' || purine === undefined || sugar === undefined || kcal === undefined || purine < 0 || sugar < 0 || kcal < 0) {
      const message = await this.translate.get("HOME.TOASTS.CUSTOM_MEAL_INVALID").toPromise();
      presentToast(this.toastController, message, ToastColors.DANGER);
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
}