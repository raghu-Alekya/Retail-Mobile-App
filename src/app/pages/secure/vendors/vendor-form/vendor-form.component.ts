import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
    selector: 'app-vendor-form', // ✅ IMPORTANT
    imports: [CommonModule, FormsModule, IonicModule], // ✅ REQUIRED
    templateUrl: './vendor-form.component.html',
    styleUrls: ['./vendor-form.component.scss']
})
export class VendorFormComponent implements OnInit {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() vendor: any;
  phoneError: string = '';
  emailError: string = '';
  isSaving = false;
  vendorNameTouched = false;
addressTouched = false;
vendorNameEmojiError = false;
addressEmojiError = false;
emailEmojiError = false;

  form = {
    title: '',
    phone: '',
    email: '',
    address: ''
  };

  originalForm = {};

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private toastController: ToastController,
    private alertCtrl: AlertController
  ) {}

  containsEmoji(text: string): boolean {
  if (!text) return false;

  return /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(text);
}

removeEmojis(value: string): string {
  return value.replace(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
    ''
  );
}

onVendorNameInput(event: any) {
  const value = event.target.value || '';

  this.vendorNameEmojiError = this.containsEmoji(value);

  this.form.title = this.removeEmojis(value);
}

onAddressInput(event: any) {
  const value = event.target.value || '';

  this.addressEmojiError = this.containsEmoji(value);

  this.form.address = this.removeEmojis(value);
}

  ngOnInit() {
    if (this.mode === 'edit' && this.vendor) {
      this.form.title = this.vendor.title;
      this.form.phone = this.vendor.meta?._vendor_phone;
      this.form.email = this.vendor.meta?._vendor_email;
      this.form.address = this.vendor.meta?._vendor_address;

      this.originalForm = { ...this.form };
    }
  }

  onPhoneInput(event: any) {
  let value = event.target.value || '';

  // remove non-numeric
  value = value.replace(/\D/g, '');

  // limit to 10 digits
  value = value.substring(0, 10);

  this.form.phone = value;

  this.validatePhone();
}

  validatePhone() {
  const phone = this.form.phone || '';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    this.phoneError = '';
  } else if (cleaned.length !== 10) {
    this.phoneError = 'Phone number must be exactly 10 digits';
  } else {
    this.phoneError = '';
  }
}

onEmailInput(event: any) {
  let value = event.target.value || '';

  this.emailEmojiError = this.containsEmoji(value);

  // remove emojis
  value = this.removeEmojis(value);

  // trim spaces
  value = value.trim();

  this.form.email = value;

  this.validateEmail();
}

validateEmail() {
  const email = this.form.email || '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    this.emailError = '';
  } else if (!emailRegex.test(email)) {
    this.emailError = 'Please enter a valid email address';
  } else {
    this.emailError = '';
  }
}
  async save() {

    if (
  this.containsEmoji(this.form.title) ||
  this.containsEmoji(this.form.address)
) {
  await this.presentToast(
    'Vendor Name and Address cannot contain emojis',
    'warning'
  );
  this.isSaving = false;
  return;
}
  if (this.isSaving) return;

  this.isSaving = true;

  const title = (this.form.title || '').trim();

  if (!title) {
    await this.presentToast('Vendor name is required', 'warning');
    this.isSaving = false;
    return;
  }

// ✅ update trimmed value back
this.form.title = title;

    this.validatePhone();
    this.validateEmail(); // 👈 ADD THIS

    if (this.phoneError || this.emailError) {
  await this.presentToast(
    this.phoneError || this.emailError,
    'warning'
  );
  this.isSaving = false; // ✅ ADD THIS LINE
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
    }finally {
  setTimeout(() => {
    this.isSaving = false;
  }, 500);
}
  }

  async confirmDelete() {
    if (!this.vendor?.id) return;

    const alert = await this.alertCtrl.create({
      header: 'Delete Vendor',
      message: `Are you sure you want to delete "${this.form.title || 'this vendor'}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.deleteVendor();
          }
        }
      ]
    });

    await alert.present();
  }

    async deleteVendor() {
    if (!this.vendor?.id) return;

    try {
      const res = await this.authService.deleteVendor(this.vendor.id);
      await this.presentToast(res?.data?.message || 'Vendor deleted', 'success');
      this.modalCtrl.dismiss(true);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete vendor';

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

  hasValue(): boolean {
  return !!(
    this.form.title ||
    this.form.phone ||
    this.form.email ||
    this.form.address
  );
}

hasChanges(): boolean {
  return JSON.stringify(this.form) !== JSON.stringify(this.originalForm);
}
}