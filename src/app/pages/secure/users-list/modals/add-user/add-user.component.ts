import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


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
    private router: Router
    
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

  if (!this.user.role) {
    this.showAlert(
      'Validation Error',
      'Please select a role'
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
    phone: this.user.phone,
    emp_login_pin: this.user.emp_login_pin
  });

  if (response?.success) {
    await this.showAlert('Success', 'Employee created successfully');
    this.modalCtrl.dismiss(true);
  }

} catch (e: any) {
  this.showAlert(
    'Error',
    e?.response?.data?.message || 'Failed to create employee'
  );
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
}