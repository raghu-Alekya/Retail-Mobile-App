import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VendorsPageRoutingModule } from './vendors-routing.module';

import { VendorsPage } from './vendors.page';
import { VendorFormComponent } from './vendor-form/vendor-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VendorsPageRoutingModule
  ],
  declarations: [VendorsPage],
  entryComponents: [
    VendorFormComponent   // 🔴 REQUIRED in Angular 7
  ]
})
export class VendorsPageModule {}
