import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, APIResponse } from 'src/app/utils';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export enum WaterValue {
  GLASS,
  BOTTLE
};

export interface WaterConsumption {
  value: WaterValue;
  timestamp: number;
};

@Injectable({ providedIn: "root" })
export class WaterConsumptionService {
  private authService = inject(AuthService);
  public data$?: Promise<WaterConsumption[]>;
  public error$: Promise<string>

  constructor(private http: HttpClient) {}

  async initialize(): Promise<boolean> {
    if (!this.authService.isLogged$.getValue()) return false;
    const user = await this.authService.user$;

    const response = await firstValueFrom(this.http.get<APIResponse<WaterConsumption[]>>(`${API_URL}/water-consumption/${user.id}`));

    if (!response.success) {
      this.error$ = Promise.resolve(response.message);
      return false;
    }

    this.data$ = Promise.resolve(response.data);
    return true;
  }

  async addWaterConsumption(value: WaterValue): Promise<boolean> {
    if (!this.authService.isLogged$.getValue()) return false;
    const user = await this.authService.user$;

    const waterConsumption = await this.data$ || [];
    const consumption: WaterConsumption = {
      value,
      timestamp: Date.now()
    };

    const response = await firstValueFrom(this.http.post<APIResponse<void>>(`${API_URL}/water-consumption/${user.id}`, consumption));

    if (!response.success) {
      this.error$ = Promise.resolve(response.message);
      return false;
    }

    waterConsumption.push(consumption);
    this.data$ = Promise.resolve(waterConsumption);
    return true;
  }
} 