import { Component, inject } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen'
import { AuthService } from './services/auth.service';
import { MealService } from './services/meal.service';
import { WaterConsumptionService } from './services/water_consumption';
import { TranslateService } from '@ngx-translate/core';

import { parse } from "json5";
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  constructor(private http: HttpClient) {
    this.initializeApp();
  }

  async initializeApp() {
    const enTranslation = await firstValueFrom(this.http.get("assets/i18n/en.json5", { responseType: "text" }));
    const trTranslation = await firstValueFrom(this.http.get("assets/i18n/tr.json5", { responseType: "text" }));

    this.translate.setTranslation("en", parse(enTranslation));
    this.translate.setTranslation("tr", parse(trTranslation));

    this.translate.setDefaultLang("tr");
    this.translate.use("tr");

    await SplashScreen.hide();
    const isLogged = await this.authService.initialize();

    if (isLogged) {
      await this.mealService.initialize();
      await this.waterConsumptionService.initialize();
    }
  }
}
