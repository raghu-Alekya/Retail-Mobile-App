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
  // template: `
  // <ion-header>
  //   <ion-toolbar>
  //     <ion-title>Add Employee</ion-title>
  //     <ion-buttons slot="end">
  //       <ion-button (click)="close()">Close</ion-button>
  //     </ion-buttons>
  //   </ion-toolbar>
  // </ion-header>

  // <ion-content class="ion-padding">

  //   <ion-item>
  //     <ion-label position="stacked">Username</ion-label>
  //     <ion-input [(ngModel)]="user.username"></ion-input>
  //   </ion-item>

  //   <ion-item>
  //     <ion-label position="stacked">Email</ion-label>
  //     <ion-input type="email" [(ngModel)]="user.email"></ion-input>
  //   </ion-item>

  //   <ion-item>
  //     <ion-label position="stacked">First Name</ion-label>
  //     <ion-input [(ngModel)]="user.first_name"></ion-input>
  //   </ion-item>
  //   <ion-item>
  //     <ion-label position="stacked">Last Name</ion-label>
  //     <ion-input [(ngModel)]="user.last_name"></ion-input>
  //   </ion-item>
    
  //   <ion-item>
  //     <ion-label position="stacked">Password</ion-label>
  //     <ion-input type="password" [(ngModel)]="user.password"></ion-input>
  //   </ion-item>

  //   <ion-item *ngIf="this.userRole == 'employee'">
  //     <ion-label>Role</ion-label>
  //     <ion-select [(ngModel)]="user.role">
  //       <ion-select-option
  //         *ngFor="let role of customRoles"
  //         [value]="role.key">
  //         {{ role.name }}
  //       </ion-select-option>
  //     </ion-select>
  //   </ion-item>

  //   <!-- Custom fields -->
  //   <ion-item>
  //     <ion-label position="stacked">Phone</ion-label>
  //     <ion-input [(ngModel)]="user.description"></ion-input>
  //   </ion-item>

  //   <ion-item *ngIf="this.userRole == 'employee'">
  //     <ion-label position="stacked">Login PIN</ion-label>
  //     <ion-input
  //       type="tel"
  //       inputmode="numeric"
  //       pattern="[0-9]*"
  //       maxlength="6"
  //       placeholder="Enter 6-digit PIN"
  //       [(ngModel)]="user.emp_login_pin"
  //       (ionInput)="limitPinLength($event)">
  //     </ion-input>
  //   </ion-item>


  //   <ion-button
  //     expand="block"
  //     [disabled]="!customRoles.length"
  //     (click)="submit()">
  //     Create User
  //   </ion-button>

  // </ion-content>
  // `,

  template: `
  <ion-header class="custom-header">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="close()">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>Add Employee</ion-title>
      </ion-toolbar>
    </ion-header>

    

    <ion-content class="page-content">

      <div class="form-container">

        <div class="form-group">
          <label>Username</label>
          <ion-input [value]="user.username" class="custom-input"></ion-input>
        </div>

        <div class="form-group">
          <label>Email</label>
          <ion-input type="email" [(ngModel)]="user.email" class="custom-input"></ion-input>
        </div>

        <div class="form-group">
          <label>First Name</label>
          <ion-input [(ngModel)]="user.first_name" class="custom-input"></ion-input>
        </div>

        <div class="form-group">
          <label>Last Name</label>
          <ion-input [(ngModel)]="user.last_name" class="custom-input"></ion-input>
        </div>

        <div class="form-group" *ngIf="userRole === 'employee'">
          <label>Employee Role</label>
          <ion-item class="custom-item">
            <ion-select
              [(ngModel)]="user.role"
              interface="popover">
              <ion-select-option *ngFor="let role of customRoles" [value]="role.key">
                {{ role.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </div>


        <div class="form-group">
          <label>Phone</label>
          <ion-input [(ngModel)]="user.phone" class="custom-input"></ion-input>
        </div>

        <div class="form-group" *ngIf="userRole === 'employee'">
          <label>Login PIN</label>
          <ion-input
            type="tel"
            maxlength="6"
            placeholder="Enter 6-digit PIN"
            [(ngModel)]="user.emp_login_pin"
            (ionInput)="limitPinLength($event)"
            class="custom-input">
          </ion-input>
        </div>

        <ion-button expand="block" class="save-btn" (click)="submit()">
          Create User
        </ion-button>

      </div>

    </ion-content>
  `,

  styles: [`

  :host {
    font-family: 'Inter', sans-serif;
  }

  /* Header */
  .custom-header {
    font-family: 'Inter', sans-serif;
  }


  /* Header Block */
  .custom-header {
    background: #2f4157;   /* Same color as screenshot */
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    overflow: hidden;
  }

  /* Toolbar */
  .custom-header ion-toolbar {
    --background: transparent;
    --color: #ffffff;
    --min-height: 70px;   /* Increase block height */
    padding-top: 6px;     /* ↓ reduce extra spacing */
    padding-bottom: 6px;
  }

  /* Title */
  .custom-header ion-title {
    font-size: 22px;
    font-weight: 500;
  }

  /* Back Button */
  .custom-header ion-button {
    --color: #ffffff;
  }


  /* Page background */
  .page-content {
    --background: #ffffff;
  }

  /* Form container */
  .form-container {
    padding: 20px;
  }

  /* Form styling */
  .form-group {
    margin-bottom: 18px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    color: #666;
    font-size: 14px;
  }

  .custom-input {
    --background: #e1e4ea;
    --padding-start: 12px;
    border-radius: 12px;
  }

  .custom-item {
    --background: #e1e4ea;
    --padding-start: 12px;
    border-radius: 12px;
  }


  /* Save button */
  .save-btn {
    --background: #2f4157;
    margin-top: 20px;
  }

  `]
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
