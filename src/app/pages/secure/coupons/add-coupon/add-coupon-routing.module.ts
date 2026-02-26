import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';


import { AddCouponPage } from './add-coupon.page';

const routes: Routes = [
  {
    path: '',
    component: AddCouponPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddCouponPageRoutingModule {}
