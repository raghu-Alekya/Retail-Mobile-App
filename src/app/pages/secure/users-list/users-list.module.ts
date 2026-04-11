import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { UsersListPageRoutingModule } from './users-list-routing.module';
import { UsersListPage } from './users-list.page';
import { AddUserComponent } from './modals/add-user/add-user.component';

@NgModule({
  declarations: [
    UsersListPage   // ✅ keep only non-standalone here
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UsersListPageRoutingModule,
    AddUserComponent   // ✅ ADD HERE
  ]
})
export class UsersListPageModule {}