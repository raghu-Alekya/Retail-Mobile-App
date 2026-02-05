import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-pos-settings',
  templateUrl: './pos-settings.page.html',
  styleUrls: ['./pos-settings.page.scss'],
})
export class PosSettingsPage implements OnInit {

  form!: FormGroup;
  user: any;
  toast: string = '';
  isToastOpen = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();

    this.form = this.fb.group({
      enable_safes: [false],
      enable_safes_drop: [false],
      currency_symbol: ['', Validators.required],
       // Cash Back
      enable_cashback: [false],

      // Service Charge
      enable_service_charge: [false],

      // Loyalty Points
      enable_loyalty_points: [false]
    });

    this.loadSettings();
  }

  /* ======================
     FormArray getters
     ====================== */

  get notes(): FormArray {
    return this.form.get('notes') as FormArray;
  }

  get coins(): FormArray {
    return this.form.get('coins') as FormArray;
  }

  /* ======================
     Helpers
     ====================== */

  private createDenomination(denom = '', image = ''): FormGroup {
    return this.fb.group({
      denom: [denom, Validators.required],
      image: [image]
    });
  }

  addDenomination(array: FormArray, denom = '', image = '') {
    array.push(this.createDenomination(denom, image));
  }

  removeDenomination(array: FormArray, index: number) {
    array.removeAt(index);
  }

  clearFormArray(array: FormArray) {
    while (array.length) {
      array.removeAt(0);
    }
  }

  /* ======================
     API Calls
     ====================== */

  async loadSettings() {
    try {
      const res = await this.authService.getCashSettings();
      const data = res.data.data;

      this.form.patchValue({
        enable_safes: data.enable_safes,
        enable_safes_drop: data.enable_safes_drop,
        currency_symbol: data.currency_symbol,

        pinaka_pos_enable_loyalty_points: data.pinaka_pos_enable_loyalty_points.enabled,
        pinaka_pos_service_charge_settings: data.pinaka_pos_service_charge_settings.enabled,
        pinaka_pos_cashback_settings: data.pinaka_pos_cashback_settings
      });
    } catch (err) {
      console.error('Failed to load POS settings', err);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const res = await this.authService.saveCashSettings(this.form.value);

      // ✅ SUCCESS
      const message =
        res?.data?.data?.message ||
        res?.data?.message ||
        'Settings saved successfully';

      await this.presentToast(message, 'success');

    } catch (err: any) {

      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }


  signOut() {
    this.authService.logout();
  }

   async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });

    await toast.present();
  }

}
