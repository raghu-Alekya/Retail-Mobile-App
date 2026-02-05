import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PosSettingsPageRoutingModule } from './pos-settings-routing.module';
import { PosSettingsPage } from './pos-settings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // 🔥 REQUIRED
    IonicModule,
    PosSettingsPageRoutingModule
  ],
  declarations: [PosSettingsPage]
})
export class PosSettingsPageModule {}
