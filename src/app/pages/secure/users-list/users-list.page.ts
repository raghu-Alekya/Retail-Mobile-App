import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ModalController,NavController } from '@ionic/angular';
import { AddUserComponent } from './modals/add-user/add-user.component';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.page.html',
    styleUrls: ['./users-list.page.scss'],
    standalone: false
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
  loading = false;
  popupShown = false;
  private searchTimeout: any;
  usernameTouched = false;
firstNameTouched = false;
lastNameTouched = false;

  constructor(
  private authService: AuthService,
  private modalCtrl: ModalController,
  private navCtrl: NavController,
  private alertCtrl: AlertController,
  private router: Router,
  private toastCtrl: ToastController
) {}

containsEmoji(text: string): boolean {
  if (!text) return false;

  return /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(text);
}

removeEmojis(value: string): string {

  return value.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF])/g,
    ''
  );
}

onUsernameInput(event: any) {

  const value =
    event.target.value || '';

  const cleaned =
    this.removeEmojis(value);

  this.editedUser.username =
    cleaned;

  event.target.value =
    cleaned;

  this.checkChanges();
}

onFirstNameInput(event: any) {

  const value =
    event.target.value || '';

  const cleaned =
    this.removeEmojis(value);

  this.editedUser.first_name =
    cleaned;

  event.target.value =
    cleaned;

  this.checkChanges();
}

onLastNameInput(event: any) {

  const value =
    event.target.value || '';

  const cleaned =
    this.removeEmojis(value);

  this.editedUser.last_name =
    cleaned;

  event.target.value =
    cleaned;

  this.checkChanges();
}

async ngOnInit() {

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
}
  async openAddEmployee() {
    this.checktoken();
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

  this.checktoken();  
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

    if (
  this.containsEmoji(this.editedUser.username) ||
  this.containsEmoji(this.editedUser.email) ||
  this.containsEmoji(this.editedUser.first_name) ||
  this.containsEmoji(this.editedUser.last_name)
) {
  this.showAlert(
    'Validation Error',
    'Username, Email, First Name and Last Name cannot contain emojis'
  );
  return;
}
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

      

      const response = await this.authService.updateEmployee(this.editingUserId!, payload);
      console.log('UPDATE EMPLOYEE RESPONSE 👉', response);

      if (response?.success || (response && response.id)) { // Sometimes update returns the object directly
        this.editingUserId = null;
        this.loadUsers();
      } else {
        throw { error: response || { message: 'An unknown error occurred' } };
      }

    } catch (e: any) {
      console.log('FULL ERROR 👉', e);
      console.log('ERROR BODY 👉', e.error);

      let message =
        e?.error?.message ||
        e?.error?.data?.message ||
        e?.error?.error ||
        JSON.stringify(e?.error || e);

      console.log('FINAL MESSAGE 👉', message);

      if (typeof message === 'string' && message.toLowerCase().includes('pin')) {
        this.pinError = ''; // Clear so no inline red text is shown
        this.showAlert('Error', message);
      } else {
        // If it's another error, don't blindly assume it's a PIN error.
        this.pinError = ''; 
        let errorMsg = typeof message === 'string' ? message : 'An error occurred while updating the employee';
        // Clean up stringified objects if we just get {}
        if (errorMsg === '{}') errorMsg = 'An error occurred while updating the employee';
        
        this.showAlert('Error', errorMsg);
      }
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
        user?.first_name?.toLowerCase().startsWith(value) ||
        user?.email?.toLowerCase().startsWith(value) ||
        user?.id?.toString().startsWith(value)
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

  async loadUsers() {
  if (this.loading) return;

  this.loading = true;

  try {

    const usersArray = await this.authService.getUsers("1", "50", '');

    this.users = usersArray.filter((user: any) =>
      Array.isArray(user?.roles) && !user.roles.includes('customer')
    );

    // newest first
    this.users.sort((a: any, b: any) => b.id - a.id);

    this.filteredUsers = [...this.users];

  } catch (error) {
    console.error('Error loading users', error);
  } finally {
    this.loading = false;
  }
}

  getRoleLabel(roles: string[]) {
    if (!Array.isArray(roles) || roles.length === 0) return '';
    return roles[0].replace('_', ' ');
  }
  
  emailTouched = false;
phoneTouched = false;
pinTouched = false;
pinError = '';

isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

isValidPin(pin: string): boolean {
  return /^[0-9]{6}$/.test(pin);
}

limitPhoneLength(event: any) {
  const value = event.target.value || '';
  this.editedUser.phone = value.replace(/\D/g, '').slice(0, 10);
}

limitPinLength(event: any) {
  const value = event.target.value || '';
  this.editedUser.emp_login_pin = value.replace(/\D/g, '').slice(0, 6);

  // clear backend error on typing
  this.pinError = '';
}
 async checktoken() {
    
  const token = localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!).token : null;

    if (!token || token === 'undefined' || token === 'null') {

      await this.showLogoutPopup();

      return false;
    }

    try {

      const res: any = await this.authService.validateuser(token);
      if (
        res?.valid === 'false' ||
        res?.valid === false ||
        res?.valid === '0' ||
        res?.valid === 0
      ) {

        await this.showLogoutPopup();

        return false;
      }

      // TOKEN VALID
      if (res?.valid) {
        return true;
      }

      return true;

    } catch (error: any) {
  await this.showLogoutPopup();

  return false;
    }
  }
  async showLogoutPopup() {

    if (this.popupShown) {
      return;
    }

    this.popupShown = true;

    let countdown = 5;

    const alert = await this.alertCtrl.create({
      cssClass: 'custom-logout-alert',
      backdropDismiss: false,

      message: `
        <div class="logout-popup">

          <img src="../../assets/session-logout.png" class="logout-img" />

          <div class="logout-title">
            You've been logged out
          </div>

          <div class="logout-message">
            Your account was logged in from another device.
            For security reasons your session has ended.
          </div>

          <div class="logout-countdown">
            Redirecting in <span id="countdown">${countdown}</span>
          </div>

        </div>
      `
    });

    await alert.present();

    const interval = setInterval(async () => {

      countdown--;

      const countdownEl = document.getElementById('countdown');

      if (countdownEl) {
        countdownEl.innerText = countdown.toString();
      }

      if (countdown === 0) {

        clearInterval(interval);

        await alert.dismiss();

        localStorage.clear();
        sessionStorage.clear();

        this.popupShown = false;

        await this.navCtrl.navigateRoot('/signin');
      }

    }, 1000);
  }
}