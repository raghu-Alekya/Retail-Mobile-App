import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderPaymentsPage } from './order-payments.page';

const routes: Routes = [
  {
    path: '',
    component: OrderPaymentsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderPaymentsPageRoutingModule {}
