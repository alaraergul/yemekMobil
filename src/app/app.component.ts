import { Component, inject } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen'
import { AuthService } from './services/auth/auth.service';
import { MealService } from './services/meal/meal.service';
import { WaterConsumptionService } from './services/water_consumption/water_consumption';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  authService = inject(AuthService);
  mealService = inject(MealService);
  waterConsumptionService = inject(WaterConsumptionService);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await SplashScreen.hide();
    const isLogged = await this.authService.initialize();

    if (isLogged) {
      await this.mealService.initialize();
      await this.waterConsumptionService.initialize();
    }
  }
}
