import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PosClosingPage } from './pos-closing.page';

const routes: Routes = [
  {
    path: '',
    component: PosClosingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PosClosingPageRoutingModule {}
