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

  gender: 'male' | 'female' | 'other' | undefined;
  weight: number | null = null;
  purineLimit: number | null = null;
  sugarLimit: number | null = null;
  kcalLimit: number | null = null;

  constructor() {}

  async ngOnInit() {
    const user = await this.authService.getUser();
    if (user) {
      this.gender = user.gender as unknown as 'male' | 'female' | 'other';
      this.weight = user.weight;
      this.purineLimit = user.purineLimit;
      this.sugarLimit = user.sugarLimit;
      this.kcalLimit = user.kcalLimit;
    }
  }

  async saveSettings() {
    const settingsToUpdate: Partial<User> = {
      gender: this.gender,
      weight: this.weight,
      ...(this.purineLimit !== null || this.sugarLimit !== null || this.kcalLimit !== null
        ? {
            limits: {
              purine: this.purineLimit ?? undefined,
              sugar: this.sugarLimit ?? undefined,
              kcal: this.kcalLimit ?? undefined
            }
          }
        : {})
    };
    
    await this.authService.editUser(
      this.purineLimit ?? undefined,
      this.sugarLimit ?? undefined,
      this.kcalLimit ?? undefined,
      this.gender as unknown as Gender
    );
    
    const toast = await this.toastController.create({
      message: 'Ayarların kaydedildi!',
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    toast.present();
    
  }
}