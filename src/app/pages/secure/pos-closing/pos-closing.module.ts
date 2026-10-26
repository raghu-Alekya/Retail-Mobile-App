import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PosClosingPageRoutingModule } from './pos-closing-routing.module';

import { PosClosingPage } from './pos-closing.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PosClosingPageRoutingModule
  ],
  declarations: [PosClosingPage]
})
export class PosClosingPageModule {}
