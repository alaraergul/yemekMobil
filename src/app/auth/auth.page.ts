import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth/auth.service';

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
    RouterModule
  ]
})
export class AuthPage {
  Tabs = Tabs;
  activeTab = Tabs.LOGIN;

  username = '';
  password = '';
  regUsername = '';
  regPassword = '';
  regWeight: number | null = null;

  constructor(
    public authService: AuthService,
    private toastController: ToastController,
    private router: Router
  ) {
    this.authService.onLogin(() => {
      this.router.navigateByUrl("/home");
    });
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
      this.showToast('Giriş başarılı!', 'success');
    } else {
      this.showToast('Kullanıcı adı veya şifre hatalı!', 'danger');
    }
  }

  async register() {
    if (!this.regUsername || !this.regPassword || this.regWeight === null) {
      this.showToast('Lütfen tüm alanları doldurunuz.', 'warning');
      return;
    }

    if (this.regWeight <= 0) {
      this.showToast('Geçerli bir kilo giriniz!', 'warning');
      return;
    }

    const success = await this.authService.register(this.regUsername, this.regPassword, this.regWeight);

    if (success) {
      this.showToast('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
      this.activeTab = Tabs.LOGIN;
    } else {
      this.showToast('Bu kullanıcı adı zaten alınmış!', 'danger');
    }
  }

  logout() {
    this.authService.logout();
  }
}
