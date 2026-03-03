import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { UsersListPageRoutingModule } from './users-list-routing.module';
import { UsersListPage } from './users-list.page';
import { AddUserComponent } from './modals/add-user/add-user.component';

@NgModule({
  declarations: [
    UsersListPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UsersListPageRoutingModule,
    AddUserComponent   // ✅ standalone component goes here
  ]
})
export class UsersListPageModule {}