import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, Meal, MealEntry } from 'src/app/utils';
import { AuthService } from '../auth/auth.service';
import { meals } from 'src/app/data';

@Injectable({ providedIn: "root" })
export class MealService {
  public authService = inject(AuthService);
  public data$?: Promise<MealEntry[]>;

  constructor(private http: HttpClient) {}

  getMeals(): Meal[] {
    return meals;
  }

  getSortedMeals(): Meal[] {
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

  async addMealEntry(id: number, count: number, timestamp: number): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.user$;

    const meals = this.getMeals();
    const selectedMeal = meals.find((meal) => meal.id === id);
    if (!selectedMeal) return false;

    const mealEntry: MealEntry = {
      meal: selectedMeal,
      count,
      timestamp
    };

    await fetch(`${API_URL}/users/${user.id}/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        count,
        timestamp
      })
    });

    const data = await this.data$ || [];
    data.push(mealEntry);

    this.data$ = Promise.resolve(data);
    return true;
  }

  async getAllMealEntries(): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.user$;

    this.http.get<({ id: number, count: number, timestamp: number })[]>(`${API_URL}/users/${user.id}/meals`).subscribe((response) => {
      const entries: MealEntry[] = [];

      for (const value of response) {
        const matchedMeal = meals.find((meal) => meal.id === value.id);
        if (matchedMeal) {
          entries.push({
            meal: matchedMeal,
            count: value.count,
            timestamp: value.timestamp
          });
        }
      }

      this.data$ = Promise.resolve(entries);
    });

    return true;
  }
}
