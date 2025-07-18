import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, Meal, MealCategory, MealEntry } from 'src/app/utils';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: "root" })
export class MealService {
  public authService = inject(AuthService);
  public data$?: Promise<MealEntry[]>;
  public categories$?: Promise<MealCategory[]>;

  constructor(private http: HttpClient) {}

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
    if (!this.authService.isLogged) return false;
    const user = await this.authService.user$;

    const data = await this.data$ as MealEntry[];
    if (!data.some((entry) => entry.meal.id === id && entry.timestamp === timestamp)) return false;

    await fetch(`${API_URL}/users/${user.id}/meals`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, timestamp })
    });

    this.data$ = Promise.resolve(data.filter((entry) => entry.meal.id !== id || entry.timestamp !== timestamp));
    return true;
  }

  async addMealEntries(mealEntries: MealEntry[]): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.user$;

    const categories = await this.categories$ || [];
    const data = await this.data$ || [];
    const willBeAdded = [];

    for (const entry of mealEntries) {
      for (const category of categories) {
        const selectedMeal = category.meals.find((meal) => meal.id === entry.meal.id);

        if (selectedMeal) {
          const mealEntry: MealEntry = {
            meal: selectedMeal,
            count: entry.count,
            timestamp: entry.timestamp
          };

          data.push(mealEntry);
          willBeAdded.push({
            id: selectedMeal.id,
            count: entry.count,
            timestamp: entry.timestamp
          });
        }
      }
    }

    if (willBeAdded.length == 0) return false;

    await fetch(`${API_URL}/users/${user.id}/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(willBeAdded)
    });

    this.data$ = Promise.resolve(data);
    return true;
  }

  async initialize(): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.user$;
    const categories = await firstValueFrom(this.http.get<MealCategory[]>(`${API_URL}/meals/${user.id}`));

    this.http.get<({ id: number, count: number, timestamp: number })[]>(`${API_URL}/users/${user.id}/meals`).subscribe((response) => {
      const entries: MealEntry[] = [];

      for (const value of response) {
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
    });

    this.categories$ = Promise.resolve(categories);
    return true;
  }
}
