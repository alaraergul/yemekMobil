import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, APIResponse, Language } from 'src/app/utils';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export interface Meal {
  id: number;
  name: string;
  purine: number; // mg
  quantity: number; // g
  kcal: number;
  sugar: number; // g
  category: string;
};

export interface CustomMeal {
  names: string[];
  purine: number;
  kcal: number;
  sugar: number;
  quantity: number;
};

export interface MealCategory {
  name: string;
  meals: Meal[];
};

// for API
export interface MealDOT {
  id: number,
  count: number,
  timestamp: number
};

export interface MealEntry<T> {
  meal: T;
  count: number;
  timestamp: number;
};

@Injectable({ providedIn: "root" })
export class MealService {
  private authService = inject(AuthService);
  public data$?: Promise<MealEntry<Meal>[]>;
  public categories$?: Promise<MealCategory[]>;

  constructor(private http: HttpClient) {
    this.authService.languageChanged$.subscribe(() => {
      this.initialize();
    });
  }

  getAllMeals(categories: MealCategory[]) {
    const meals: Meal[] = [];

    for (const category of categories) {
      for (const meal of category.meals) {
        meals.push({
          ...meal,
          category: category.name
        })
      }
    }

    return meals;
  }

  getSortedMeals(meals: Meal[]): Meal[] {
    return meals.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
  }

  async deleteMealEntry(id: number, timestamp: number): Promise<boolean> {
    if (!this.authService.isLogged$.getValue()) return false;
    const user = await this.authService.user$;

    const data = await this.data$ as MealEntry<Meal>[];
    if (!data.some((entry) => entry.meal.id === id && entry.timestamp === timestamp)) return false;

    /*
    const response = await firstValueFrom(this.http.delete<APIResponse>(`${API_URL}/meals/${user.id}/data`, { id, timestamp }));
    if (!response.status) return false;

    this.data$ = Promise.resolve(data.filter((entry) => entry.meal.id !== id || entry.timestamp !== timestamp));
    */
    return true;
  }

  async addCustomMeal(meal: CustomMeal): Promise<Meal> {
    const user = await this.authService.user$;
    const {value: username} = await Preferences.get({key: "username"});
    const {value: password} = await Preferences.get({key: "password"});

    const categories = await this.categories$ || [];
    const response = await firstValueFrom(this.http.post<APIResponse<Meal>>(`${API_URL}/custom-meals/`, {
      username,
      password,
      ...meal
    }));

    if (!response.success) {
      return null;
    }

    let categoryName;

    switch (user.language) {
      case Language.TURKISH:
        categoryName = "Özel Yemekler";
        break;

      case Language.ENGLISH:
        categoryName = "Custom Meals";
        break;
    }

    if (categories.some((category) => category.name == categoryName)) {
      const category = categories.find((category) => category.name == categoryName);
      category.meals.push(response.data);
    } else {
      categories.push({
        name: categoryName,
        meals: [response.data]
      })
    }

    this.categories$ = Promise.resolve(categories);
    return response.data;
  }

  async addMealEntries(mealEntries: MealEntry<Meal | CustomMeal>[]): Promise<boolean> {
    if (!this.authService.isLogged$.getValue()) return false;
    const user = await this.authService.user$;

    const data = await this.data$ || [];
    const willBeAdded: MealDOT[] = [];

    for (const entry of mealEntries) {
      let meal: Meal;

      if (!("id" in entry.meal)) { 
        meal = await this.addCustomMeal(entry.meal);
      } else {
        meal = entry.meal;
      }

      if (meal) {
        const mealEntry: MealEntry<Meal> = {
          meal,
          count: entry.count,
          timestamp: entry.timestamp
        };

        data.push(mealEntry);
        willBeAdded.push({
          id: meal.id,
          count: entry.count,
          timestamp: entry.timestamp
        });
      }
    }

    if (willBeAdded.length == 0) return false;

    try {
      const response = await firstValueFrom(this.http.post<APIResponse<void>>(`${API_URL}/meals/${user.id}/data`, willBeAdded));
      if (!response.success) return false;

      this.data$ = Promise.resolve(data);
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    if (!this.authService.isLogged$.getValue()) return false;
    const user = await this.authService.user$;

    const categoriesResponse = await firstValueFrom(this.http.get<APIResponse<MealCategory[]>>(`${API_URL}/meals/${user.id}`));
    if (!categoriesResponse.success) return false;

    const dataResponse = await firstValueFrom(this.http.get<APIResponse<MealDOT[]>>(`${API_URL}/meals/${user.id}/data`));
    if (!dataResponse.success) return false;

    const categories = categoriesResponse.data;
    const entries: MealEntry<Meal>[] = [];

    for (const value of dataResponse.data) {
      for (const category of categories) {
        const matchedMeal = category.meals.find((meal) => meal.id === value.id);

        if (matchedMeal) {
          entries.push({
            meal: matchedMeal,
            count: value.count,
            timestamp: value.timestamp
          });

          break;
        }
      }
    }

    this.data$ = Promise.resolve(entries);
    this.categories$ = Promise.resolve(categories);
    return true;
  }
}