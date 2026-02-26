import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditCouponPageRoutingModule } from './edit-coupon-routing.module';

import { EditCouponPage } from './edit-coupon.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditCouponPageRoutingModule
  ],
  declarations: [EditCouponPage]
})
export class EditCouponPageModule {}
