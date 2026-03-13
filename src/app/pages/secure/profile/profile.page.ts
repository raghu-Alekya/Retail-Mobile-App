import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef;

  user: any = {
    firstName: '',
    lastName: '',
    email: ''
  };

  // UI States
  isBlurActive = false;
  isPreviewMode = false;

  previewImage: string | ArrayBuffer | null = null;
  savedImage: string | ArrayBuffer | null = null;

  constructor(
  private http: HttpClient,
  private router: Router,
  private navCtrl: NavController,
  private alertController: AlertController,
  private authService: AuthService
) {}

ngOnInit() {

  this.authService.currentUser$.subscribe(user => {
    this.user = user;
  });

  this.loadProfile();

}

loadProfile() {

  const token = this.authService.getToken();

  this.http.get<any>(
    'https://merchantretail.alektasolutions.com/wp-json/pinaka-pos/v1/profile',
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  ).subscribe(res => {

    console.log("PROFILE DATA:", res);

    if (res.profile_image) {
      this.savedImage = res.profile_image;
    }

  }, err => {
    console.error("Profile load error", err);
  });

}
  // 🔹 Open file manager
  openFilePicker() {
    this.isBlurActive = true;

    setTimeout(() => {
      this.fileInput.nativeElement.click();
    }, 100);
  }

  // 🔹 When image selected
  onFileSelected(event: any) {
    const file = event.target.files[0];

    // If user cancels
    if (!file) {
      this.isBlurActive = false;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result;

      // Remove blur
      this.isBlurActive = false;

      // Enable preview mode (highlight + save button)
      this.isPreviewMode = true;
    };

    reader.readAsDataURL(file);
  }

  // 🔹 Save image
  saveImage() {

  const file = this.fileInput.nativeElement.files[0];
  if (!file) return;

  const token = this.authService.getToken();

  const formData = new FormData();
  formData.append('profile_image', file);

  this.http.post(
    'https://merchantretail.alektasolutions.com/wp-json/pinaka-pos/v1/profile',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  ).subscribe((res: any) => {

    console.log("UPLOAD RESPONSE:", res);

    if (res.status) {

      this.isPreviewMode = false;
      this.previewImage = null;

      this.loadProfile();

    }

  }, err => {
    console.error("Upload failed", err);
  });

}

 
  goToEditProfile() {
    this.router.navigate(['/tabs/edit-profile']);
  }

  goToChangePassword() {
    this.router.navigate(['/tabs/change-password']);
  }

  // goToAddress() {
  //   this.router.navigate(['/tabs/address']);
  // }

async signOut() {
  const alert = await this.alertController.create({
    header: 'Sign Out?',
    message: 'Are you sure you want to log out?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Sign Out',
        handler: async () => {

          // Clear everything properly
          localStorage.clear();
          sessionStorage.clear();

          // If AuthService stores user
          this.authService.logout?.();  // (if you have logout method)

          // Navigate & remove back history
          this.navCtrl.navigateRoot('/signin');
        }
      }
    ]
  });

  await alert.present();
}
}