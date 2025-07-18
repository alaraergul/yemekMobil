import { Component, inject } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen'
import { AuthService } from './services/auth/auth.service';
import { MealService } from './services/meal/meal.service';
import { WaterConsumptionService } from './services/water_consumption/water_consumption';
import { TranslateService } from '@ngx-translate/core';

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
  translate = inject(TranslateService);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    this.translate.setDefaultLang('tr');
    this.translate.use('tr');

    await SplashScreen.hide();
    const isLogged = await this.authService.initialize();

    if (isLogged) {
      await this.mealService.initialize();
      await this.waterConsumptionService.initialize();
    }
  }
}
