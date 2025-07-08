import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { AuthService } from 'src/app/services/auth/auth.service';

enum Tabs {
  LOGIN,
  REGISTER
}

@Component({
  selector: 'app-tab1',
  standalone: true,
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  imports: [
    CommonModule,     
    FormsModule,
    IonicModule,
    RouterModule
  ]
})
export class Tab1Page {
  Tabs = Tabs;
  activeTab = Tabs.LOGIN;

  username = '';
  password = '';
  regUsername = '';
  regPassword = '';
  regWeight: number | null = null;

  constructor(public authService: AuthService) {}

  login() {
    this.authService.login(this.username, this.password);
  }

  register() {
    if (this.regWeight !== null) {
      this.authService.register(this.regUsername, this.regPassword, this.regWeight);
    }
  }

  logout() {
    this.authService.logout();
  }
}
