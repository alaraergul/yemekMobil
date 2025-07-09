import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular'; 
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';
import { Gender } from '../utils';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  authService = inject(AuthService);
  public purineLimit?: number;
  public sugarLimit?: number;
  public kcalLimit?: number;
  public weight: Gender = 0;
  public gender?: Gender;

  Gender = Gender;

  constructor(private router: Router) {}

  async ngOnInit() {
    const user = await this.authService.getUser();
    user.weight = user.weight;
  }

  async setUserSettings() {
    await this.authService.editUser(this.purineLimit, this.sugarLimit, this.kcalLimit, this.gender)
  }
}