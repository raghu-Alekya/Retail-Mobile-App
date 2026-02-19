import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
showLogoutModal = false;

  constructor(
    private router: Router,
    private alertController: AlertController   // ✅ ADD
  ) {}

  editProfile() {
    console.log('Pencil clicked');
  }

  goToEditProfile() {
    this.router.navigate(['/tabs/edit-profile']);
  }

  goToChangePassword() {
    this.router.navigate(['/tabs/change-password']);
  }

  goToAddress() {
    this.router.navigate(['/tabs/address']);
  }
  
  // ✅ SHOW CONFIRMATION POPUP
  async confirmLogout() {

  const alert = await this.alertController.create({
    header: 'Sign Out?',
    message: 'Are you sure you want to log out of your account?',
    cssClass: 'logout-alert',   // 🔥 IMPORTANT
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'cancel-btn'
      },
      {
        text: 'Sign Out',
        cssClass: 'confirm-btn',
        handler: () => {
          this.logout();
        }
      }
    ]
  });

  await alert.present();
}



  // ✅ ACTUAL LOGOUT LOGIC
  logout() {
    console.log('Logout clicked');

    // Example:
    // localStorage.clear();
    // this.router.navigate(['/login']);
  }

}
