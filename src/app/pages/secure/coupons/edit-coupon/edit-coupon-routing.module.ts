import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditCouponPage } from './edit-coupon.page';

const routes: Routes = [
  {
    path: '',
    component: EditCouponPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditCouponPageRoutingModule {}
