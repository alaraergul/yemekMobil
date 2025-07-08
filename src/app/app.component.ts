import { Component, inject } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen'
import { AuthService } from './services/auth/auth.service';
import { MealService } from './services/meal/meal.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  authService = inject(AuthService);
  mealService = inject(MealService);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    SplashScreen.hide();
    const isLogged = await this.authService.initialize();

    if (isLogged) {
      await this.mealService.getAllMealEntries();
    }
  }
}
