import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tab1Page } from './tab1.page';

@NgModule({
  imports: [RouterModule.forChild([{ path: '', component: Tab1Page }]), Tab1Page],
})
export class Tab1PageModule {}
