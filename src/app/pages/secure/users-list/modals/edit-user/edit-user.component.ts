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
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title *ngIf="this.userRole == 'customer'">Edit Customer</ion-title>
      <ion-title *ngIf="this.userRole == 'employee'">Edit Employee</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="close()">Close</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">

    <ion-item>
      <ion-label position="stacked">Username</ion-label>
      <ion-input [value]="user.username" disabled></ion-input>
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
    <ion-item *ngIf="this.userRole == 'employee'">
      <ion-label>Role</ion-label>
      <ion-select [(ngModel)]="user.role">
        <ion-select-option
          *ngFor="let role of roles"
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

    <ion-button expand="block" (click)="updateUser()">
      Update User
    </ion-button>

  </ion-content>
  `,
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
