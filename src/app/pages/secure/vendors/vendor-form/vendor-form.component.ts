import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-vendor-form',
  standalone: true, // ✅ IMPORTANT
  imports: [CommonModule, FormsModule, IonicModule], // ✅ REQUIRED
  templateUrl: './vendor-form.component.html',
  styleUrls: ['./vendor-form.component.scss']
})
export class VendorFormComponent implements OnInit {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() vendor: any;

  form = {
    title: '',
    phone: '',
    email: '',
    address: ''
  };

  constructor(private modalCtrl: ModalController, 
    private authService: AuthService, private toastController: ToastController) {}

  ngOnInit() {
    if (this.mode === 'edit' && this.vendor) {
      this.form.title = this.vendor.title;
      this.form.phone = this.vendor.meta?._vendor_phone;
      this.form.email = this.vendor.meta?._vendor_email;
      this.form.address = this.vendor.meta?._vendor_address;
    }
  }

  async save() {

    if (!this.form.title) {
      await this.presentToast('Vendor name is required', 'warning');
      return;
    }

    const payload = {
      title: this.form.title,
      phone: this.form.phone,
      email: this.form.email,
      address: this.form.address
    };

    try {

      let response;

      if (this.mode === 'add') {
        response = await this.authService.createVendor(payload);
      } else {
        response = await this.authService.updateVendor(
          this.vendor.id,
          payload
        );
      }

      await this.presentToast(
        response?.data?.message || 'Vendor saved successfully',
        'success'
      );

      // ✅ Close modal only on success
      this.modalCtrl.dismiss(true);

    } catch (err: any) {

      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save vendor';

      await this.presentToast(errorMessage, 'danger');
    }
  }

  
    async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });

    await toast.present();
  }


  close() {
    this.modalCtrl.dismiss(null);
  }
}
