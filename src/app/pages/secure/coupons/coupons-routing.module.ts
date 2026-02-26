import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CouponsPage } from './coupons.page';

const routes: Routes = [
  {
    path: '',
    component: CouponsPage
  },  {
    path: 'add-coupon',
    loadChildren: () => import('./add-coupon/add-coupon.module').then( m => m.AddCouponPageModule)
  },
  {
    path: 'edit-coupon',
    loadChildren: () => import('./edit-coupon/edit-coupon.module').then( m => m.EditCouponPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CouponsPageRoutingModule {}
