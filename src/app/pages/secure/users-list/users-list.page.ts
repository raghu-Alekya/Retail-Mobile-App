import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ModalController } from '@ionic/angular';
import { AddUserComponent } from './modals/add-user/add-user.component';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

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
  customRoles: any[] = [];
  isUsernameLocked = false;

  private searchTimeout: any;

  constructor(
  private authService: AuthService,
  private modalCtrl: ModalController,
  private alertCtrl: AlertController,
  private router: Router,
  private loadingCtrl: LoadingController,
  private toastCtrl: ToastController
) {}

//   async ionViewDidEnter() {

//   this.loadUsers();

//   const navigation = this.router.getCurrentNavigation();
//   const state = navigation?.extras?.state as any;

//   if (state?.autoOpenCreate) {
//     console.log('Auto-opening Add User modal');
//     this.openAddEmployee();
//   }

// }
async ngOnInit() {

  const loading = await this.loadingCtrl.create({
    message: '',
    spinner: 'crescent'
  });

  await loading.present();

  try {

    const state = history.state;

    if (state?.autoOpenCreate) {
      this.openAddEmployee();
      history.replaceState({}, '');
    }

    await this.loadUsers();
    this.customRoles = await this.authService.getCustomRoles();

  } catch (error) {
    console.error(error);
  }

  loading.dismiss();
}
  async openAddEmployee() {

  const modal = await this.modalCtrl.create({
    component: AddUserComponent,
    componentProps: {
      userRole: 'employee'
    }
  });

  await modal.present();

  // wait until modal closes
  const { data } = await modal.onDidDismiss();

  // if employee created successfully
  if (data === true) {
    await this.loadUsers();   // reload employee list
  }

}

editEmployee(user: any) {

  this.editingUserId = user.id;

  this.editedUser = {
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.roles?.[0] || '',
    phone: user.meta?.user_phone || '',
    emp_login_pin: user.meta?.emp_login_pin || ''
  };

  this.originalUser = { ...this.editedUser };

  // 🔒 lock username if already exists
  this.isUsernameLocked = !!user.username;

}
  
  // openEditUser(user: any, slidingItem: any) {
  //   slidingItem.close(); 
  //   this.editingUserId = user.id;

  //   this.editedUser = {
  //     username: user.username || user.name || '',
  //     email: user.email || '',
  //     first_name: user.first_name || '',
  //     last_name: user.last_name || '',

  //     role: Array.isArray(user?.roles) ? user.roles[0] : '',
  //     phone: user?.meta?.billing_phone || '',
  //     emp_login_pin: user?.meta?.emp_login_pin || ''
  //   };

  //   this.originalUser = { ...this.editedUser };
  // }
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
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {

          try {

            // delete employee
            await this.authService.deleteEmployee(id);

            // close edit screen
            this.cancelEdit();

            // reload employee list
            await this.loadUsers();

            // show success message
            const toast = await this.toastCtrl.create({
              message: 'Employee deleted successfully',
              duration: 2000,
              position: 'bottom',
              color: 'success'
            });

            await toast.present();

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
      user_phone: this.editedUser.phone,
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
  this.isUsernameLocked = false; // reset
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

    this.users = usersArray.filter((user: any) =>
      Array.isArray(user?.roles) && !user.roles.includes('customer')
    );

    // ⭐ NEW: show newest employee on top
    this.users.sort((a: any, b: any) => b.id - a.id);

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