import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, WaterConsumption, Error, WaterValue } from 'src/app/utils';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: "root" })
export class WaterConsumptionService {
  private authService = inject(AuthService);
  public data$?: Promise<WaterConsumption[]>;

  constructor(private http: HttpClient) {}

  async initialize(): Promise<void> {
    if (!this.authService.isLogged) return;
    const user = await this.authService.user$;

    const response = firstValueFrom(
      this.http.get<WaterConsumption[] | Error>(`${API_URL}/users/${user.id}/water-consumption`)
    );

    if ((await response as Error).code) return;
    this.data$ = response as Promise<WaterConsumption[]>;
  }

  async addWaterConsumption(value: WaterValue): Promise<boolean> {
    if (!this.authService.isLogged) return false;
    const user = await this.authService.user$;
    const waterConsumption = await this.data$ || [];
    const data: WaterConsumption = {
      value,
      timestamp: Date.now()
    };

    await fetch(`${API_URL}/users/${user.id}/water-consumption`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });

    waterConsumption.push(data);
    this.data$ = Promise.resolve(waterConsumption);
    return true;
  }
}
