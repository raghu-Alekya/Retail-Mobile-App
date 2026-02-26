import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ModalController } from '@ionic/angular';
import { AddUserComponent } from './modals/add-user/add-user.component';
@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.scss'],
})
export class UsersListPage implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  editingUserId: number | null = null;
  editedUser: any = {};
  originalUser: any = {};
  isChanged = false;


  constructor(
    private authService: AuthService,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }
async openAddEmployee() {
  const modal = await this.modalCtrl.create({
    component: AddUserComponent,
    componentProps: {
      userRole: 'employee'   // ✅ PASS ROLE HERE
    }
  });

  await modal.present();
}
openEditUser(user: any) {
  this.editingUserId = user.id;

  this.editedUser = {
    username: user.username || user.name,
    email: user.email,
    first_name: user.first_name || '',
    last_name: user.last_name || '',

    role: user.roles?.[0] || '',
    phone: user.description || '',   // 🔥 from description
    emp_login_pin: user.meta?.emp_login_pin || ''
  };

  this.originalUser = { ...this.editedUser };
}
checkChanges() {
  this.isChanged =
    JSON.stringify(this.originalUser) !==
    JSON.stringify(this.editedUser);
}
async saveChanges() {
  try {

    const payload = {
      username: this.editedUser.username,
      email: this.editedUser.email,
      first_name: this.editedUser.first_name,
      last_name: this.editedUser.last_name,

      roles: [this.editedUser.role],

      // 🔥 THIS IS IMPORTANT
      description: this.editedUser.phone,

      meta: {
        emp_login_pin: this.editedUser.emp_login_pin
      }
    };

    await this.authService.updateUser(this.editingUserId!, payload);

    this.editingUserId = null;
    this.loadUsers();

  } catch (error) {
    console.error("Error updating user:", error);
  }
}
cancelEdit() {
  this.editingUserId = null;
  this.isChanged = false;
}
  async loadUserForEdit(id: number) {
  try {
    const user = await this.authService.getUserById(id);

    this.editedUser = { ...user };
    this.originalUser = { ...user };

  } catch (error) {
    console.error('Error loading user', error);
  }
}

  async loadUsers() {
    try {
      const data = await this.authService.getUsers('', 1, 20);

      console.log('RAW USERS:', data);

      this.users = Array.isArray(data.users)
        ? data.users.filter((user: any) =>
            user.roles && !user.roles.includes('customer')
          )
        : [];

      this.filteredUsers = [...this.users];

    } catch (error) {
      console.error('Error loading users', error);
    }
  }

  onSearch(event: any) {
    const value = event.target.value.toLowerCase();

    this.users = this.filteredUsers.filter(user =>
      user.name?.toLowerCase().includes(value) ||
      user.id?.toString().includes(value)
    );
  }

  getRoleLabel(roles: string[]) {
    if (!roles || roles.length === 0) return '';
    return roles[0].replace('_', ' ');
  }
  
}