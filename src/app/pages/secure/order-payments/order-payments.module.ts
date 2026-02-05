import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrderPaymentsPageRoutingModule } from './order-payments-routing.module';

import { OrderPaymentsPage } from './order-payments.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderPaymentsPageRoutingModule
  ],
  declarations: [OrderPaymentsPage]
})
export class OrderPaymentsPageModule {}
