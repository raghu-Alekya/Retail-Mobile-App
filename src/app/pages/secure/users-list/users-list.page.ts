import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ModalController } from '@ionic/angular';
import { AddUserComponent } from './modals/add-user/add-user.component';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.scss'],
})
export class UsersListPage {

  users: any[] = [];
  filteredUsers: any[] = [];

  editingUserId: number | null = null;
  editedUser: any = {};
  originalUser: any = {};
  isChanged = false;

  private searchTimeout: any;

  constructor(
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  ionViewDidEnter() {
    this.loadUsers();
  }

  async openAddEmployee() {
    const modal = await this.modalCtrl.create({
      component: AddUserComponent,
      componentProps: {
        userRole: 'employee'
      }
    });

    await modal.present();


    // ✅ reload after close
    const { data } = await modal.onDidDismiss();
    if (data?.refresh) {
        this.loadUsers();
    }
  }
  
  openEditUser(user: any, slidingItem: any) {
    slidingItem.close(); 
    this.editingUserId = user.id;

    this.editedUser = {
      username: user.username || user.name || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',

      role: Array.isArray(user?.roles) ? user.roles[0] : '',
      phone: user?.meta?.billing_phone || '',
      emp_login_pin: user?.meta?.emp_login_pin || ''
    };

    this.originalUser = { ...this.editedUser };
  }
  checkChanges() {
    this.isChanged =
      JSON.stringify(this.originalUser) !==
      JSON.stringify(this.editedUser);
  }

  async deleteUser(id: number) {

  const alert = await this.alertCtrl.create({
    header: 'Delete Employee',
    message: 'Are you sure you want to delete this employee?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'secondary'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          try {
            await this.authService.deleteEmployee(id);
            this.loadUsers(); // refresh list
          } catch (error) {
            console.error('Delete error:', error);
          }
        }
      }
    ]
  });

  await alert.present();
}

  async saveChanges() {
    try {

      const payload: any = {
      username: this.editedUser.username,
      email: this.editedUser.email,
      first_name: this.editedUser.first_name,
      last_name: this.editedUser.last_name,
      role: this.editedUser.role,
      billing_phone: this.editedUser.phone,
      emp_login_pin: this.editedUser.emp_login_pin
    };

      

      await this.authService.updateEmployee(this.editingUserId!, payload);

      this.editingUserId = null;
      this.loadUsers();

    } catch (error) {
      console.error("Error updating user:", error);
    }
  }
  // ✅ Cancel Edit
  cancelEdit() {
    this.editingUserId = null;
    this.editedUser = {};
    this.originalUser = {};
    this.isChanged = false;
  }

  // ✅ Debounced Search
  onSearch(event: any) {
    const value = event?.target?.value?.toLowerCase() || '';

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      if (!value) {
        this.filteredUsers = [...this.users];
        return;
      }

      this.filteredUsers = this.users.filter(user =>
        user?.name?.toLowerCase().includes(value) ||
        user?.email?.toLowerCase().includes(value) ||
        user?.id?.toString().includes(value)
      );
    }, 300);
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

  // ✅ Load Users
  async loadUsers() {
    try {
      const usersArray = await this.authService.getUsers("1", "50", '');

      console.log('RAW USERS:', usersArray);

      // ✅ SAFE filtering
      this.users = usersArray.filter((user: any) =>
        Array.isArray(user?.roles) && !user.roles.includes('customer')
      );

      this.filteredUsers = [...this.users];

    } catch (error) {
      console.error('Error loading users', error);
    }
  }

  getRoleLabel(roles: string[]) {
    if (!Array.isArray(roles) || roles.length === 0) return '';
    return roles[0].replace('_', ' ');
  }
  
  
}