import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProfilePageRoutingModule } from './profile-routing.module';
import { ProfilePage } from './profile.page';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

@NgModule({ declarations: [ProfilePage], imports: [CommonModule,
        FormsModule,
        IonicModule,
        ProfilePageRoutingModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class ProfilePageModule {}