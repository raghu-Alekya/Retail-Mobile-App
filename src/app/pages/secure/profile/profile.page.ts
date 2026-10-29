import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
 
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  user: any = null;
 
  constructor(
    private router: Router,
    private navCtrl: NavController,
    private alertController: AlertController,
    private authService: AuthService
  ) {}
 
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.user = user;
    });
  }
 
  ionViewWillEnter() {
    this.loadProfile();
  }
 
  async loadProfile() {
    try {
      const res = await this.authService.getProfile();
      this.user = res?.merchant || res;
    } catch (err) {
      console.error('Profile load error', err);
    }
  }
 
  goToEditProfile() {
    this.router.navigate(['/tabs/editprofile']);
  }
 
  async signOut() {
    const alert = await this.alertController.create({
      header: 'Sign Out?',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Sign Out',
          handler: async () => {
            localStorage.clear();
            sessionStorage.clear();
            this.authService.logout?.();
            this.navCtrl.navigateRoot('/signin');
          }
        }
      ]
    });
 
    await alert.present();
  }
}