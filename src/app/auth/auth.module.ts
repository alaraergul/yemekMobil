import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthPage } from './auth.page';

@NgModule({
  imports: [RouterModule.forChild([{ path: '', component: AuthPage }]), AuthPage],
})
export class AuthPageModule {}
