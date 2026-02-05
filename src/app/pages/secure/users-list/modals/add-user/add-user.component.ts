import { Component, OnInit } from '@angular/core';
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
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Add Employee</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="close()">Close</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">

    <ion-item>
      <ion-label position="stacked">Username</ion-label>
      <ion-input [(ngModel)]="user.username"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Email</ion-label>
      <ion-input type="email" [(ngModel)]="user.email"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">First Name</ion-label>
      <ion-input [(ngModel)]="user.first_name"></ion-input>
    </ion-item>
    <ion-item>
      <ion-label position="stacked">Last Name</ion-label>
      <ion-input [(ngModel)]="user.last_name"></ion-input>
    </ion-item>
    
    <ion-item>
      <ion-label position="stacked">Password</ion-label>
      <ion-input type="password" [(ngModel)]="user.password"></ion-input>
    </ion-item>

    <ion-item *ngIf="this.userRole == 'employee'">
      <ion-label>Role</ion-label>
      <ion-select [(ngModel)]="user.role">
        <ion-select-option
          *ngFor="let role of customRoles"
          [value]="role.key">
          {{ role.name }}
        </ion-select-option>
      </ion-select>
    </ion-item>

    <!-- Custom fields -->
    <ion-item>
      <ion-label position="stacked">Phone</ion-label>
      <ion-input [(ngModel)]="user.description"></ion-input>
    </ion-item>

    <ion-item *ngIf="this.userRole == 'employee'">
      <ion-label position="stacked">Login PIN</ion-label>
      <ion-input
        type="tel"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="6"
        placeholder="Enter 6-digit PIN"
        [(ngModel)]="user.emp_login_pin"
        (ionInput)="limitPinLength($event)">
      </ion-input>
    </ion-item>


    <ion-button
      expand="block"
      [disabled]="!customRoles.length"
      (click)="submit()">
      Create User
    </ion-button>

  </ion-content>
  `,
})
export class AddUserModal implements OnInit {

  customRoles: any[] = [];
  userRole = '';
  user: any = {
    username: '',
    email: '',
    password: '',
    role: '',
    description: '',
    emp_login_pin: '',
  };

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router
    
  ) {}

  async ngOnInit() {
    const url = this.router.url; 
      const lastSegment = url.split('/').pop();
      if (lastSegment === 'customers') {
        this.userRole = 'customer';
      } else if (lastSegment === 'employees') {
        this.userRole = 'employee';
      }
    await this.loadCustomRoles();
  }

  async loadCustomRoles() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading roles...',
    });
    await loading.present();

    try {
      this.customRoles = await this.authService.getCustomRoles();

      // ✅ Set default role safely
      if (this.customRoles.length) {
        this.user.role = this.customRoles[0].key;
      }

    } catch (e) {
      this.showAlert('Error', 'Failed to load user roles');
    } finally {
      loading.dismiss();
    }
  }

  close() {
    this.modalCtrl.dismiss(false);
  }

  async submit() {
    if (!this.user.username || !this.user.email || !this.user.password) {
      this.showAlert(
        'Validation Error',
        'Username, Email & Password are required'
      );
      return;
    }

    if (!this.user.role) {
      this.showAlert('Validation Error', 'Please select a role');
      return;
    }
    console.log('Creating user with role:', this.user);
    try {
      await this.authService.createUserWithMeta(this.user);
      this.modalCtrl.dismiss(true);
    } catch (e: any) {
      this.showAlert(
        'Error',
        e?.response?.data?.message || 'Failed to create user'
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
