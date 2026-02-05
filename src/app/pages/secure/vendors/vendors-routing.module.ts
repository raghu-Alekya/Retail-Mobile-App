import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VendorsPage } from './vendors.page';

const routes: Routes = [
  {
    path: '',
    component: VendorsPage
  },
  {
    path: 'vendor-form',
    loadChildren: () => import('./vendor-form/vendor-form.component').then( m => m.VendorFormComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorsPageRoutingModule {}
