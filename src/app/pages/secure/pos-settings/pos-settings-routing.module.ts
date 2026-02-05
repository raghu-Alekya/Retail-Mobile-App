import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PosSettingsPage } from './pos-settings.page';

const routes: Routes = [
  {
    path: '',
    component: PosSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PosSettingsPageRoutingModule {}
