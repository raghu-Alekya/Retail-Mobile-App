import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { ActionSheetController } from '@ionic/angular';


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
  

  isEditing = false;

  previewImage: string | ArrayBuffer | null = null;
  savedImage: string | ArrayBuffer | null = null;

  constructor(
  private http: HttpClient,
  private router: Router,
  private navCtrl: NavController,
  private alertController: AlertController,
  private authService: AuthService,
  private actionSheetCtrl: ActionSheetController
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
    this.user = res;

    const imageRes = await this.authService.getProfileImage();
    this.savedImage = imageRes?.image || null;

  } catch (err) {
    console.error("Profile load error", err);
  }
}
  // 🔹 Open file manager
  openFilePicker() {
    this.isBlurActive = true;

    setTimeout(() => {
      this.fileInput.nativeElement.click();
    }, 100);
  }

  selectedFile: File | null = null;

onFileSelected(event: any) {
  const file = event.target.files[0];

  if (!file) {
    this.isBlurActive = false;
    return;
  }

  this.selectedFile = file; // ✅ store file

  const reader = new FileReader();
  reader.onload = () => {
    this.previewImage = reader.result;
    this.isBlurActive = false;
    this.isPreviewMode = true;
  };

  reader.readAsDataURL(file);
}

  async saveImage() {
  const file = this.selectedFile;
  if (!file) return;

  try {
    const res = await this.authService.uploadProfileImage(file);

    if (res.status) {
      this.isPreviewMode = false;
      this.previewImage = null;
      this.savedImage = res.image ? res.image + '?t=' + Date.now() : null;

      this.fileInput.nativeElement.value = '';
      this.selectedFile = null;
      this.isEditing = false;
      this.isBlurActive = false;

      // ✅ SUCCESS POPUP
      const alert = await this.alertController.create({
        header: 'Success',
        message: 'Profile image updated successfully!',
        buttons: ['OK']
      });

      await alert.present();
    }

  } catch (err) {
    console.error("Upload failed", err);
  }
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

resetState() {
  this.previewImage = null;
  this.isPreviewMode = false;
  this.isBlurActive = false;

  // optional but useful
  this.fileInput.nativeElement.value = '';
}
ionViewWillLeave() {
  this.resetState();     // 👈 CLEAR OLD UI
  this.loadProfile();
}

showImagePopup = false;

openImageOptions() {
  this.showImagePopup = true;
}

closePopup() {
  this.showImagePopup = false;
}

async confirmDeleteImage() {
  this.closePopup(); // close popup first

  const alert = await this.alertController.create({
    header: 'Delete Image',
    message: 'Are you sure you want to delete your profile image?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          this.deleteImage(); // 👈 call delete
        }
      }
    ]
  });

  await alert.present();
}

async deleteImage() {
  try {
    console.log('DELETE API CALLED'); // for debug

    const res = await this.authService.deleteProfileImage();

    if (res.status) {
      // clear UI
      this.savedImage = null;
      this.previewImage = null;

      const alert = await this.alertController.create({
        header: 'Success',
        message: 'Profile image deleted successfully!',
        buttons: ['OK']
      });

      await alert.present();
    }

  } catch (err) {
    console.error('Delete failed', err);
  }
}
}