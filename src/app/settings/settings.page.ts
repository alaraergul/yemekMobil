import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User, Gender } from 'src/app/utils';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  authService = inject(AuthService);
  toastController = inject(ToastController);
  navCtrl = inject(NavController);

  Gender = Gender;

  gender: Gender;
  weight: number;
  purineLimit?: number;
  sugarLimit?: number;
  kcalLimit?: number;

  recommendedPurine: number = 0;
  recommendedSugar: number = 0;
  recommendedKcal: number = 0;

  currentUser: User;

  constructor() {}

  async ngOnInit() {
    this.authService.onLogin(async () => {
      const user = await this.authService.user$;

      if (user) {
        this.currentUser = user;
        this.gender = user.gender;
        this.weight = user.weight;

        const userPurineLimit = user.purineLimit;
        const userSugarLimit = user.sugarLimit;
        const userKcalLimit = user.kcalLimit;

        delete user.purineLimit;
        delete user.sugarLimit;
        delete user.kcalLimit;

        const defaults = this.authService.getLimits(user);
        this.recommendedPurine = defaults.purineLimit;
        this.recommendedSugar = defaults.sugarLimit;
        this.recommendedKcal = defaults.kcalLimit;

        user.purineLimit = userPurineLimit;
        user.sugarLimit = userSugarLimit;
        user.kcalLimit = userKcalLimit;

        this.purineLimit = (typeof user.purineLimit === 'number' && user.purineLimit !== -1) ? user.purineLimit : defaults.purineLimit;
        this.sugarLimit = (typeof user.sugarLimit === 'number' && user.sugarLimit !== -1) ? user.sugarLimit : defaults.sugarLimit;
        this.kcalLimit = (typeof user.kcalLimit === 'number' && user.kcalLimit !== -1) ? user.kcalLimit : defaults.kcalLimit;
      }
    });
  }

  sanitizeLimits() {
    this.purineLimit = (typeof this.purineLimit === 'number' && !isNaN(this.purineLimit)) ? this.purineLimit : null;
    this.sugarLimit = (typeof this.sugarLimit === 'number' && !isNaN(this.sugarLimit)) ? this.sugarLimit : null;
    this.kcalLimit = (typeof this.kcalLimit === 'number' && !isNaN(this.kcalLimit)) ? this.kcalLimit : null;
  }

  async saveSettings() {
    this.sanitizeLimits();

    try {
      await this.authService.editUser(
        this.purineLimit ?? null,
        this.sugarLimit ?? null,
        this.kcalLimit ?? null,
        this.gender ?? null,
        this.weight ?? null
      );

      const toast = await this.toastController.create({
        message: "Ayarların başarıyla kaydedildi!",
        duration: 2000,
        position: "top",
        color: "success"
      });
      toast.present();

    } catch (error) {
      console.error("Ayarlar kaydedilirken hata oluştu:", error);

      const toast = await this.toastController.create({
        message: "Ayarlar kaydedilirken bir hata oluştu. Lütfen tekrar dene.",
        duration: 3000,
        position: "top",
        color: "danger"
      });
      toast.present();
    }
  }

  resetLimits() {
    this.currentUser.purineLimit = null;
    this.currentUser.sugarLimit = null;
    this.currentUser.kcalLimit = null;

    const defaults = this.authService.getLimits(this.currentUser);
    this.purineLimit = defaults.purineLimit;
    this.sugarLimit = defaults.sugarLimit;
    this.kcalLimit = defaults.kcalLimit;

    const toast = this.toastController.create({
      message: "Limitler önerilen değerlere sıfırlandı.",
      duration: 2000,
      position: "top",
      color: "warning"
    });
    toast.then(t => t.present());
  }
}
