import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { tr } from 'date-fns/locale';
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
  settings: any = {
    address: {
      pinaka_pos_name: '',
      pinaka_pos_email: '',
      pinaka_pos_phone: '',
      pinaka_pos_business_address: '',
      pinaka_pos_business_city: '',
      pinaka_pos_business_state: '',
      pinaka_pos_business_postcode: ''
    },
    sellingLocations: '',
    enableTaxes: false,
    enableCoupons: false,
    sequentialCoupons: false,
    
  };

  categories: { name: string; id: number }[] = [];
  tags: string[] = [];

  newCategory = '';
  newTag = '';

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
    this.loadCategories();
    this.loadTags();
  }

  async loadTags() {
    try {
      const res = await this.authService.getTags();
      this.tags = res.map((tag: any) => tag.name);
    } catch (err) {
      console.error('Failed to load product tags', err);
    }
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
      this.settings.address = {
        pinaka_pos_name: data.shop_info.pinaka_pos_name,
        pinaka_pos_email: data.shop_info.pinaka_pos_email,
        pinaka_pos_phone: data.shop_info.pinaka_pos_phone,
        pinaka_pos_business_address: data.shop_info.pinaka_pos_business_address,
        pinaka_pos_business_city: data.shop_info.pinaka_pos_business_city,
        pinaka_pos_business_state: data.shop_info.pinaka_pos_business_state,
        pinaka_pos_business_postcode: data.shop_info.pinaka_pos_business_postcode
      }
      this.settings.enableTaxes = data.tax_enabled;
      this.settings.enableCoupons = data.coupons_enabled;
      this.settings.sequentialCoupons = data.cal_sequential_coupons;
      this.settings.enable_safes = data.enable_safes;
      this.settings.enable_safes_drop = data.enable_safes_drop;
      this.settings.currency_symbol = data.currency_symbol;
      

      console.log(this.settings.address);
    } catch (err) {
      console.error('Failed to load POS settings', err);
    }
  }

  async loadCategories() {
    try {
      const res = await this.authService.getCategories(1, 100);
      this.categories = res.map((cat: any) => ({ name: cat.name, id: cat.id }));
    } catch (err) {
      console.error('Failed to load product categories', err);
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
      position: 'bottom',
      color
    });

    await toast.present();
  }

  async saveAddress() {
    const payload = {
      shop_address: {
        pinaka_pos_name: this.settings.address.pinaka_pos_name,
        pinaka_pos_email: this.settings.address.pinaka_pos_email,
        pinaka_pos_phone: this.settings.address.pinaka_pos_phone,
        pinaka_pos_business_address: this.settings.address.pinaka_pos_business_address,
        pinaka_pos_business_city: this.settings.address.pinaka_pos_business_city,
        pinaka_pos_business_state: this.settings.address.pinaka_pos_business_state,
        pinaka_pos_business_postcode: this.settings.address.pinaka_pos_business_postcode
      },
    };
    // 🔌 API call
    try {
      const response = await this.authService.saveBussinessInfo(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
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

  /* =====================
     TAX TOGGLE
     ===================== */

  async updateEnableTaxes() {
    const payload = {
      enable_taxes: this.settings.enableTaxes,
    };

    console.log('Enable Taxes Payload', payload);
    // 🔌 API call
    try {
       const response = await this.authService.enableTaxes(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      await this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }

  /* =====================
     COUPONS TOGGLE
     ===================== */

  async updateEnableCoupons() {
    if (!this.settings.enableCoupons) {
      this.settings.sequentialCoupons = false;
    }

    const payload = {
      enable_coupons: this.settings.enableCoupons,
    };

    console.log('Enable Coupons Payload', payload);
    // 🔌 API call
    try {
       const response = await this.authService.enableCoupons(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      this.presentToast(errorMessage, 'danger');
    }
  }

  /* =====================
     SEQUENTIAL COUPONS
     ===================== */

  async updateSequentialCoupons() {
    const payload = {
      coupon_sequential: this.settings.sequentialCoupons,
    };

    console.log('Sequential Coupons Payload', payload);

    try {
       const response = await this.authService.sequentialCoupons(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      this.presentToast(errorMessage, 'danger');
    }
    // 🔌 API call
  }

  /* =====================
     CURRENCY
     ===================== */

  changeCurrency() {
    const payload = {
      currency: this.settings.currency,
    };

    console.log('Currency Payload', payload);
    // 🔌 API call
  }

  /* =====================
     SELLING LOCATIONS
     ===================== */

  openSellingLocations() {
    console.log('Selling locations clicked');
    // optional modal
  }

  /* =====================
     PRODUCT CATEGORIES
     ===================== */

  async addCategory() {
    if (!this.newCategory.trim()) return;

    const all_categories = {
      product_categories: this.categories,
    };

    const payload = {
      name:this.newCategory.trim()
    };
    // 🔌 API call
    console.log('Add Category Payload', payload);
    
    try {
      const response = await this.authService.saveCategory(payload);
        // ✅ SUCCESS
      console.log('Added Category Response', response);
      const addedCategory = {
        name: response.data.name,
        id: response.data.id
      };
      this.categories.push(addedCategory);
        const message = 
          response?.data?.message ||
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

  async removeCategory(category_id: number) {

    const payload = {
      id: category_id,
    };

    console.log('Remove Category Payload', payload);
    try {
      this.authService.deleteCategory(category_id);
      this.categories = this.categories.filter(cat => cat.id !== category_id);
      await this.presentToast('Category deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete category', err);
      await this.presentToast('Failed to delete category', 'danger');
    }
    // 🔌 API call
  }

  /* =====================
     PRODUCT TAGS
     ===================== */

  addTag() {
    if (!this.newTag.trim()) return;

    this.tags.push(this.newTag.trim());
    this.newTag = '';

    const payload = {
      product_tags: this.tags,
    };

    console.log('Add Tag Payload', payload);
    // 🔌 API call
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);

    const payload = {
      product_tags: this.tags,
    };

    console.log('Remove Tag Payload', payload);
    // 🔌 API call
  }

  async onToggleChange(event: any, setting: string) {
    const isChecked = event.detail.checked;

    switch (setting) {

      case 'enable_safes':
        this.settings.enable_safes = isChecked;
        await this.updateEnableSafes();
        break

      case 'enable_safes_drop':
        this.settings.enable_safes_drop = isChecked;
        await this.updateEnableSafesDrop();
        break;

      case 'enable_cashback':
        this.settings.enable_cashback = isChecked;
        await this.updateCashback();
        break;

      case 'enable_service_charge':
        this.settings.enable_service_charge = isChecked;
        await this.updateServiceCharge();
        break;
        
      case 'enable_loyalty_points':
        this.settings.enable_loyalty_points = isChecked;
        await this.updateLoyaltyPoints();
        break;

      case 'enableTaxes':
        this.settings.enableTaxes = isChecked;
        await this.updateEnableTaxes();
        break;

      case 'enableCoupons':
        this.settings.enableCoupons = isChecked;

        // auto-disable sequential if coupons turned off
        if (!isChecked) {
          this.settings.sequentialCoupons = false;
        }

        await this.updateEnableCoupons();
        break;

      case 'sequentialCoupons':
        this.settings.sequentialCoupons = isChecked;
        await this.updateSequentialCoupons();
        break;
    }
  }

  async updateEnableSafes() {
    const payload = {
      enable_safes: this.settings.enable_safes,
    };

    console.log('Enable Safes Payload', payload);
    // 🔌 API call
    try {
      const response = await this.authService.updateEnableSafes(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      await this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }

  async updateEnableSafesDrop() {
    const payload = {
      enable_safes_drop: this.settings.enable_safes_drop,
    };

    console.log('Enable Safes Drop Payload', payload);
    // 🔌 API call
    try {
      const response = await this.authService.updateEnableSafesDrop(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      await this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }

  async updateCashback() {
    const payload = {
      enable_cashback: this.settings.enable_cashback,
    };

    console.log('Enable Cashback Payload', payload);
    // 🔌 API call
    try {
      const response = await this.authService.updateCashback(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      await this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }

  async updateServiceCharge() {
     const payload = {
      enable_service_charge: this.settings.enable_service_charge,
    };

    console.log('Enable Service Charge Payload', payload);
    // 🔌 API call
    try {
      const response = await this.authService.updateServiceCharge(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      await this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }

  async updateLoyaltyPoints() {
     const payload = {
      enable_loyalty_points: this.settings.enable_loyalty_points,
    };

    console.log('Enable Loyalty Points Payload', payload);
    // 🔌 API call
    try {
      const response = await this.authService.updateLoyaltyPoints(payload);
       // ✅ SUCCESS
      const message = 
        response?.data?.message ||
        'Settings saved successfully';
      await this.presentToast(message, 'success');
    } catch (err) {
      // ✅ AXIOS ERROR HANDLING
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to save settings';

      await this.presentToast(errorMessage, 'danger');
    }
  }

}
