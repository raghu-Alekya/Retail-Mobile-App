import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersListPageRoutingModule } from './orders-list-routing.module';

import { OrderListPage } from './orders-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersListPageRoutingModule
  ],
  declarations: [OrderListPage]
})
export class OrdersListPageModule {}
