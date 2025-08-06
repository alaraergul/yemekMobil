import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { User, Gender, Language, presentToast, ToastColors } from 'src/app/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  authService = inject(AuthService);
  toastController = inject(ToastController);
  translateService = inject(TranslateService);
  navCtrl = inject(NavController);
  private alertController = inject(AlertController);

  Gender = Gender;
  Language = Language;

  gender: Gender;
  weight: number;
  language: Language;
  firstName: string;
  lastName: string;
  purineLimit?: number;
  sugarLimit?: number;
  kcalLimit?: number;

  recommendedPurine: number = 0;
  recommendedSugar: number = 0;
  recommendedKcal: number = 0;

  currentUser: User;

  async ngOnInit() {
    this.authService.onLogin(async () => {
      const user = await this.authService.user$;

      if (user) {
        this.currentUser = user;
        this.firstName = user.firstName;
        this.lastName = user.lastName;

        this.gender = user.gender;
        this.weight = user.weight;
        this.language = user.language;

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

        this.purineLimit = (typeof user.purineLimit === 'number') ? user.purineLimit : defaults.purineLimit;
        this.sugarLimit = (typeof user.sugarLimit === 'number') ? user.sugarLimit : defaults.sugarLimit;
        this.kcalLimit = (typeof user.kcalLimit === 'number') ? user.kcalLimit : defaults.kcalLimit;
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
        this.weight ?? null,
        this.language ?? null,
        this.firstName ?? null,
        this.lastName ?? null
      );

      const toast = await this.toastController.create({
        message: await firstValueFrom(this.translateService.get("SETTINGS.SAVED")),
        duration: 2000,
        position: "top",
        color: "success"
      });

      toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: await firstValueFrom(this.translateService.get("SETTINGS.ERROR")),
        duration: 3000,
        position: "top",
        color: "danger"
      });
      toast.present();
    }
  }

  async resetLimits() {
    this.currentUser.purineLimit = null;
    this.currentUser.sugarLimit = null;
    this.currentUser.kcalLimit = null;

    const defaults = this.authService.getLimits(this.currentUser);
    this.purineLimit = defaults.purineLimit;
    this.sugarLimit = Math.round(defaults.sugarLimit);
    this.kcalLimit = defaults.kcalLimit;

    const toast = this.toastController.create({
      message: await firstValueFrom(this.translateService.get("SETTINGS.RESETTED")),
      duration: 2000,
      position: "top",
      color: "warning"
    });
    toast.then(t => t.present());
  }

  async deleteAccount() {
    const header = await firstValueFrom(this.translateService.get("SETTINGS.DELETE_ACCOUNT_ALERT.TITLE"));
    const message = await firstValueFrom(this.translateService.get("SETTINGS.DELETE_ACCOUNT_ALERT.MESSAGE"));
    const confirmButton = await firstValueFrom(this.translateService.get("SETTINGS.DELETE_ACCOUNT_ALERT.CONFIRM"));
    const cancelButton = await firstValueFrom(this.translateService.get("SETTINGS.DELETE_ACCOUNT_ALERT.CANCEL"));

    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: cancelButton,
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: confirmButton,
          handler: async () => {
            const success = await this.authService.deleteUser();
            if (success) {
              const toastMessage = await firstValueFrom(this.translateService.get("SETTINGS.DELETE_ACCOUNT_SUCCESS"));
              presentToast(this.toastController, toastMessage, ToastColors.SUCCESS);
              this.navCtrl.navigateRoot("/auth");
            } else {
              const toastMessage = await firstValueFrom(this.translateService.get("SETTINGS.ERROR"));
              presentToast(this.toastController, toastMessage, ToastColors.DANGER);
            }
          },
        },
      ],
    });

    await alert.present();
  }
}