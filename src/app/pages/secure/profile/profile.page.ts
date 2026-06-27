import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { ActionSheetController } from '@ionic/angular';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';



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

  previewImage: SafeUrl | string | ArrayBuffer | null = null;
  savedImage: string | ArrayBuffer | null = null;
  selectedNativeImagePath: string | null = null;

  constructor(
  private http: HttpClient,
  private router: Router,
  private navCtrl: NavController,
  private alertController: AlertController,
  private authService: AuthService,
  private loadingController: LoadingController,
  private actionSheetCtrl: ActionSheetController,
  private sanitizer: DomSanitizer
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
  async openFilePicker() {

  if (Capacitor.isNativePlatform()) {

    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    });

    this.selectedNativeImagePath = image.path || null;

    const previewUrl =
  image.webPath ||
  (image.path ? Capacitor.convertFileSrc(image.path) : null);

if (previewUrl) {
  this.previewImage =
    this.sanitizer.bypassSecurityTrustUrl(previewUrl);
}

this.isPreviewMode = true;
    return;
  }

  this.fileInput.nativeElement.click();
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

  const loading = await this.loadingController.create({
    message: 'Uploading image...',
    spinner: 'crescent',
    backdropDismiss: false
  });

  await loading.present();

  try {

    let res: any;

    if (this.selectedNativeImagePath) {

      res = await this.authService.uploadProfileImageFromPath(
        this.selectedNativeImagePath
      );

    } else {

      const file = this.selectedFile;

      if (!file) {
        await loading.dismiss();
        return;
      }

      res = await this.authService.uploadProfileImage(file);
    }

    const response = res?.data || res;

    if (response?.status) {

      this.isPreviewMode = false;
      this.previewImage = null;

      this.savedImage =
        response.image
          ? response.image + '?t=' + Date.now()
          : null;

      this.fileInput.nativeElement.value = '';

      this.selectedFile = null;
      this.selectedNativeImagePath = null;

      this.isEditing = false;
      this.isBlurActive = false;

      await this.loadProfile();

      await loading.dismiss();

      const alert = await this.alertController.create({
        header: 'Success',
        message: 'Profile image updated successfully!',
        buttons: ['OK']
      });

      await alert.present();
    } else {
      await loading.dismiss();
    }

  } catch (err) {

    await loading.dismiss();

    console.error('Upload failed', err);

    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Failed to upload profile image.',
      buttons: ['OK']
    });

    await alert.present();
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

    const res = await this.authService.deleteProfileImage();

    if (res.status) {

      this.savedImage = null;
      this.previewImage = null;
      this.selectedFile = null;
      this.selectedNativeImagePath = null;

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