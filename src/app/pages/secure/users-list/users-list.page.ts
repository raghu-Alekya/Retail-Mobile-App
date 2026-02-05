import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AddUserModal } from './modals/add-user/add-user.component';
import { EditUserModal } from './modals/edit-user/edit-user.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UsersListPage implements OnInit {
  users: any[] = [];
  roleFilter = '';
  userRole = '';
  searchTerm = '';
searchDebounce: any;
  customRoles: any[] = [];


  newUser = {
    username: '',
    email: '',
    password: '',
    role: 'subscriber',
  };

  page = 1;
  totalPages = 1;
  perPage = 10;

  constructor(
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private router: Router
  ) { }

  ngOnInit() {
      const url = this.router.url; 
      const lastSegment = url.split('/').pop();
      if (lastSegment === 'customers') {
        this.userRole = 'customer';
      } else if (lastSegment === 'employees') {
        this.userRole = 'employee';
        this.loadCustomRoles(); // ✅ LOAD ROLES
      }
    this.loadUsers();
  }

  async loadUsers(reset = true) {
    if (reset) {
      this.page = 1;
      this.users = [];
    }

    const loading = await this.loadingCtrl.create({ message: 'Loading...' });
    await loading.present();

    try {
      const res = await this.authService.getUsers(
        this.roleFilter,
        this.page,
        this.perPage,
        this.userRole,
        this.searchTerm   // ✅ add this
      );
      this.users = [...this.users, ...res.users];
      this.totalPages = res.totalPages;

    } finally {
      loading.dismiss();
    }
  }


  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async openAddUserModal() {
    const modal = await this.modalCtrl.create({
      component: AddUserModal,
    });

    modal.onDidDismiss().then(res => {
      if (res.data) {
        this.loadUsers();
      }
    });

    await modal.present();
  }

    async loadMore(event: any) {
      this.page++;
      await this.loadUsers(false);
      event.target.complete();
    }

    async openEditUserModal(user: any) {
      const modal = await this.modalCtrl.create({
        component: EditUserModal,
        componentProps: {
          user: {
            id: user.id,
            username: user.slug,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.roles?.[0],
            description: user.description,
            emp_login_pin: user.meta?.emp_login_pin || '',
          },
        },
      });

      modal.onDidDismiss().then(res => {
        if (res.data) {
          this.loadUsers();
        }
      });
      await modal.present();
    }

    async confirmDeleteUser(user: any) {
      const alert = await this.alertCtrl.create({
        header: 'Confirm Delete',
        message: `Are you sure you want to delete user "${user.slug}"?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => this.deleteUser(user.id),
          },
        ],
      });
      await alert.present();
    }

    async deleteUser(userId: number) {
      const loading = await this.loadingCtrl.create({ message: 'Deleting user...' });
      await loading.present();

      try {
        await this.authService.deleteUser(userId);
        this.showAlert('Success', 'User deleted successfully.');
        this.loadUsers();
      } catch (error) {
        this.showAlert('Error', 'Failed to delete user.');
      } finally {
        loading.dismiss();
      }
    }
    onSearch(event: any) {
      const value = event.target.value || '';

      clearTimeout(this.searchDebounce);

      this.searchDebounce = setTimeout(() => {
        this.searchTerm = value.trim();
        this.loadUsers(true); // reset list
      }, 400);
    }

  async loadCustomRoles() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading roles...',
    });
    await loading.present();

    try {
      this.customRoles = await this.authService.getCustomRoles();

    } catch (e) {
      this.showAlert('Error', 'Failed to load user roles');
    } finally {
      loading.dismiss();
    }
  }

  getRoleLabel(roles: string[] = []): string {
    if (!roles || roles.includes('customer')) {
      return '';
    }

    const roleMap: any = {
      administrator: 'Administrator',
      shop_manager: 'Shop Manager',
      manager: 'Manager',
      shop_keeper: 'Shop Keeper',
      cashier: 'Cashier',
      employee: 'Employee',
    };

    // Return first matching known role
    const role = roles.find(r => roleMap[r]);

    return role ? roleMap[role] : roles[0];
  }
}
