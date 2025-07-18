import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Gender } from '../utils';
import { MealService } from '../services/meal/meal.service';
import { TranslateModule, TranslateService} from '@ngx-translate/core';

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

  activeTab = Tabs.LOGIN;

  username = '';
  password = '';
  regUsername = '';
  regPassword = '';
  regWeight: number | null = null;
  regGender: Gender | null = null;
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
    this.translate.use(event.detail.value);
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'top',
      color
    });
    await toast.present();
  }

  async login() {
    const success = await this.authService.login(this.username, this.password);

    if (success) {
      this.translate.get('AUTH.LOGIN_SUCCESS').subscribe(message => {
        this.showToast(message, 'success');
      });
    } else {
      this.translate.get('AUTH.LOGIN_FAIL').subscribe(message => {
        this.showToast(message, 'danger');
      });
    }
  }

  async register() {
    if (!this.regUsername || !this.regPassword || this.regWeight === null || this.regGender == null) {
      this.translate.get('AUTH.FILL_ALL_FIELDS').subscribe(message => {
        this.showToast(message, 'warning');
      });
      return;
    }

    if (this.regWeight <= 0) {
      this.translate.get('AUTH.VALID_WEIGHT').subscribe(message => {
        this.showToast(message, 'warning');
      });
      return;
    }

    const success = await this.authService.register(this.regUsername, this.regPassword, this.regWeight, this.regGender);

    if (success) {
      this.translate.get('AUTH.REGISTER_SUCCESS').subscribe(message => {
        this.showToast(message, 'success');
      });
      this.activeTab = Tabs.LOGIN;
    } else {
      this.translate.get('AUTH.REGISTER_FAIL').subscribe(message => {
        this.showToast(message, 'danger');
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
