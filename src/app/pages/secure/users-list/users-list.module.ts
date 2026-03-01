import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UsersListPageRoutingModule } from './users-list-routing.module';

import { UsersListPage } from './users-list.page';
import { AddUserComponent } from './modals/add-user/add-user.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UsersListPageRoutingModule
  ],
  declarations: [UsersListPage,
    AddUserComponent   // ✅ MUST BE HERE
  ],
})
export class UsersListPageModule {}
