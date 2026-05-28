import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgZone } from '@angular/core';

import {
  IonicModule,
  ModalController,
  AlertController,
  LoadingController,
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-add-user-modal',
   templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],


 
})
export class AddUserComponent implements OnInit {

  customRoles: any[] = [];
  userRole = '';
  pinError: string | null = null;
  usernameTouched = false;
firstNameTouched = false;
lastNameTouched = false;
  user: any = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: '',
  phone: '',
  emp_login_pin: ''
  
};
 
get isFormDirty(): boolean {
  return (
    this.user.username ||
    this.user.email ||
    this.user.first_name ||
    this.user.last_name ||
    this.user.role ||
    this.user.phone ||
    this.user.emp_login_pin
  );
}

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router,
  private zone: NgZone   
    
  ) {}

  async ngOnInit() {
  await this.loadCustomRoles();
}


// async loadCustomRoles() {
//   try {
//     this.customRoles = await this.authService.getCustomRoles();

//     if (this.customRoles.length) {
//       this.user.role = this.customRoles[0].key;
//     }
//   } catch (e) {
//     this.showAlert('Error', 'Failed to load user roles');
//   }
// }
  
// async loadCustomRoles() {
//   this.customRoles = await this.authService.getCustomRoles();

//   console.log('ROLES IN COMPONENT:', this.customRoles);

//   if (this.customRoles.length) {
//     this.user.role = this.customRoles[0].key;
//   }
// }
async loadCustomRoles() {
  const roles = await this.authService.getCustomRoles();
  this.customRoles = Array.isArray(roles) ? roles : [];
}
  close() {
    this.modalCtrl.dismiss(false);
  }

  
  
 async submit() {

  console.log('USER OBJECT:', this.user);

  if (!this.user.username || !this.user.email) {
    this.showAlert(
      'Validation Error',
      'Username and Email are required'
    );
    return;
  }

  // ✅ Email format validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(this.user.email)) {
    this.showAlert(
      'Invalid Email',
      'Please enter a valid email address'
    );
    return;
  }

  if (this.user.phone && !this.isValidPhone(this.user.phone)) {
    this.showAlert(
      'Invalid Phone',
      'Phone number must be exactly 10 digits'
    );
    return;
  }

  if (this.user.emp_login_pin && !this.isValidPin(this.user.emp_login_pin)) {
  this.pinError = null; // only format error should show
  return;
}

  if (!this.user.role) {
    this.showAlert(
      'Validation Error',
      'Please select a role'
    );
    return;
  }

  if (
  this.containsEmoji(this.user.username) ||
  this.containsEmoji(this.user.first_name) ||
  this.containsEmoji(this.user.last_name)
) {
  this.showAlert(
    'Validation Error',
    'Username, First Name and Last Name cannot contain emojis'
  );
  return;
}

  try {
    const response = await this.authService.createEmployee({
      username: this.user.username,
      email: this.user.email,
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      role: this.user.role,
      user_phone: this.user.phone,
      emp_login_pin: this.user.emp_login_pin,
    });

    console.log('CREATE EMPLOYEE RESPONSE 👉', response);

    if (response?.success || (response && response.id)) {
      await this.showAlert('Success', 'Employee created successfully');
      this.modalCtrl.dismiss(true);
    } else {
      // The service returned a response but it wasn't successful (e.g., error caught and returned as object)
      throw { error: response || { message: 'An unknown error occurred' } };
    }

  }catch (e: any) {
  console.log('FULL ERROR 👉', e);
  console.log('ERROR BODY 👉', e.error);

  this.zone.run(() => {
    let message =
      e?.error?.message ||
      e?.error?.data?.message ||
      e?.error?.error ||
      JSON.stringify(e?.error || e);

    console.log('FINAL MESSAGE 👉', message);

    if (typeof message === 'string' && message.toLowerCase().includes('pin')) {
      this.pinError = null; // Clear so no inline red text is shown
      this.showAlert('Error', message);
    } else {
      this.pinError = null; 
      let errorMsg = typeof message === 'string' ? message : 'An error occurred while creating the employee';
      if (errorMsg === '{}') errorMsg = 'An error occurred while creating the employee';
      
      this.showAlert('Error', errorMsg);
    }
  });
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

  limitPinLength(event: any) {
    const value = event.target.value || '';
    this.user.emp_login_pin = value.replace(/\D/g, '').slice(0, 6);
  }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  phoneTouched = false;
  limitPhoneLength(event: any) {
    const value = event.target.value || '';
    // remove non-numbers + limit to 10 digits
    this.user.phone = value.replace(/\D/g, '').slice(0, 10);
  }

  isValidPhone(phone: string): boolean {
    return /^[0-9]{10}$/.test(phone);
  }

  pinTouched = false;

  isValidPin(pin: string): boolean {
    return /^[0-9]{6}$/.test(pin);
  }

 

containsEmoji(text: string): boolean {
  if (!text) return false;

  return /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(text);
}
  
}