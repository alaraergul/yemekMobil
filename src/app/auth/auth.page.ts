import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Gender, Language, presentToast, ToastColors } from '../utils';
import { MealService } from '../services/meal/meal.service';
import { TranslateModule, TranslateService} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

enum Tabs {
  LOGIN,
  REGISTER
};

@Component({
  selector: 'app-tab1',
  standalone: true,
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    TranslateModule
  ]
})
export class AuthPage {
  Tabs = Tabs;
  Gender = Gender;
  Language = Language;

  activeTab = Tabs.LOGIN;

  username = '';
  password = '';
  regUsername = '';
  regPassword = '';
  regWeight: number | null = null;
  regGender: Gender | null = null;
  regLang: Language | null = null; 
  currentLang: string;

  constructor(
    private authService: AuthService,
    private mealService: MealService,
    private toastController: ToastController,
    private router: Router,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'tr'
    this.authService.onLogin(async () => {
      await this.mealService.initialize();
      this.router.navigateByUrl("/home");
    });
  }

  changeLanguage(event: any) {
    const lang = event.detail.value;
    this.translate.use(lang);
    this.currentLang = lang;
  }

  async login() {
    const success = await this.authService.login(this.username, this.password);

    if (success) {
      const message = await firstValueFrom(this.translate.get("AUTH.LOGIN_SUCCESS"));
      presentToast(this.toastController, message, ToastColors.SUCCESS);
    } else {
      const message = await firstValueFrom(this.translate.get("AUTH.LOGIN_FAIL"));
      presentToast(this.toastController, message, ToastColors.DANGER);
    }
  }

  async register() {
    if (!this.regUsername || !this.regPassword || this.regWeight === null || this.regGender == null || this.regLang == null) {
      const message = await firstValueFrom(this.translate.get("AUTH.FILL_ALL_FIELDS"))
      presentToast(this.toastController, message, ToastColors.WARNING);

      return;
    }

    if (this.regWeight <= 0) {
      const message = await firstValueFrom(this.translate.get("AUTH.VALID_WEIGHT"));
      presentToast(this.toastController, message, ToastColors.WARNING);

      return;
    }

    const success = await this.authService.register(this.regUsername, this.regPassword, this.regWeight, this.regGender, this.regLang);

    if (success) {
      const message = await firstValueFrom(this.translate.get("AUTH.REGISTER_SUCCESS"));
      presentToast(this.toastController, message, ToastColors.SUCCESS);

      this.activeTab = Tabs.LOGIN;
    } else {
      const message = await firstValueFrom(this.translate.get("AUTH.REGISTER_FAIL"));
      presentToast(this.toastController, message, ToastColors.DANGER);
    }
  }

  logout() {
    this.authService.logout();
  }
}