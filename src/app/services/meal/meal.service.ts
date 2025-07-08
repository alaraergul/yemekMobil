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

  async deleteMealEntry(id: number, timestamp: number): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.getUser();

    const data = await this.data$ as MealEntry[];
    if (!data.some((entry) => entry.meal.id == id && entry.timestamp == timestamp)) return false;

    await fetch(`${API_URL}/users/${user.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({id, timestamp})
    });

    this.data$ = Promise.resolve(data.filter((entry) => entry.meal.id != id || entry.timestamp != entry.timestamp));
    return true;
  }

  async addMealEntry(id: number, count: number, timestamp: number): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.getUser();

    const meals = this.getMeals();
    if (!meals.some((meal) => meal.id == id)) return false;

    const mealEntry: MealEntry = {
      meal: this.getMeals().find((meal) => meal.id == id),
      count,
      timestamp
    };

    await fetch(`${API_URL}/users/${user.id}`, {
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

    const data = await this.data$ as MealEntry[];
    data.push(mealEntry);

    this.data$ = Promise.resolve(data);
    return true;
  }

  async getAllMealEntries(): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.getUser();

    this.http.get<({ id: number, count: number, timestamp: number })[]>(`${API_URL}/users/${user.id}`).subscribe((response) => {
      const entries: MealEntry[] = [];
      const meals = this.getMeals();

      for (const value of response) {
        entries.push({
          meal: meals.find((meal) => meal.id == value.id) as Meal,
          count: value.count,
          timestamp: value.timestamp
        })
      }

      this.data$ = Promise.resolve(entries);
    });

    return true;
  }
}
