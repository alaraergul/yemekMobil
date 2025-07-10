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

  gender: Gender | undefined;
  weight: number | undefined;
  purineLimit: number | undefined;
  sugarLimit: number | undefined;
  kcalLimit: number | undefined;

  constructor() {}

  async ngOnInit() {
    this.authService.onLogin(async () => {
      const user = await this.authService.getUser();

      if (user) {
        this.gender = user.gender;
        this.weight = user.weight;
        this.purineLimit = user.purineLimit;
        this.sugarLimit = user.sugarLimit;
        this.kcalLimit = user.kcalLimit;
      }
    });
  }

  async saveSettings() {
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
}