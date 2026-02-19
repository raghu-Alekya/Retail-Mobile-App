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
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  // template: `
  // <ion-header>
  //   <ion-toolbar>
  //     <ion-title *ngIf="this.userRole == 'customer'">Edit Customer</ion-title>
  //     <ion-title *ngIf="this.userRole == 'employee'">Edit Employee</ion-title>
  //     <ion-buttons slot="end">
  //       <ion-button (click)="close()">Close</ion-button>
  //     </ion-buttons>
  //   </ion-toolbar>
  // </ion-header>
 
  // <ion-content class="ion-padding">

  //   <ion-item>
  //     <ion-label position="stacked">Username</ion-label>
  //     <ion-input [value]="user.username" disabled></ion-input>
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
  //   <ion-item *ngIf="this.userRole == 'employee'">
  //     <ion-label>Role</ion-label>
  //     <ion-select [(ngModel)]="user.role">
  //       <ion-select-option
  //         *ngFor="let role of roles"
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

  //   <ion-button expand="block" (click)="updateUser()">
  //     Update User
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

        <ion-title>
          {{ userRole === 'customer' ? 'Edit Customer' : 'Edit Employee' }}
        </ion-title>
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
              <ion-select-option *ngFor="let role of roles" [value]="role.key">
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

        <ion-button expand="block" class="save-btn" (click)="updateUser()">
          Save Changes
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
export class EditUserModal implements OnInit {

  user: any = {};
  roles: any[] = [];
  userRole = '';
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
    this.roles = await this.authService.getCustomRoles();
  }

  close() {
    this.modalCtrl.dismiss(false);
  }

  async updateUser() {
    const loading = await this.loadingCtrl.create({ message: 'Updating...' });
    await loading.present();

    const payload: any = {
      email: this.user.email,
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      description: this.user.description,
      roles: [this.user.role],
      meta: { },
    };
    if (this.userRole === 'employee') {
      payload.meta.emp_login_pin = this.user.emp_login_pin;
    }
    console.log('Updating user with payload:', payload);
    try {
      await this.authService.updateUser(this.user.id, payload);

      this.modalCtrl.dismiss(true);

    } catch (e: any) {
      this.showAlert(
        'Error',
        e?.response?.data?.message || 'Failed to update user'
      );
    } finally {
      loading.dismiss();
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
