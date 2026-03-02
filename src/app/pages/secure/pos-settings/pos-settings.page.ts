import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  isLoadingSettings = false;

  settings: any = {
    address: {},
    enableTaxes: false,
    enableCoupons: false,
    sequentialCoupons: false,
    enable_safes: false,
    enable_safes_drop: false,
    enable_cashback: false,
    enable_service_charge: false,
    enable_loyalty_points: false,
    currency_symbol: ''
  };
  categories: { name: string; id: number }[] = [];
  tags: string[] = [];

  newCategory = '';
  newTag = '';
  currencies: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastController: ToastController
  ) {}

  /* ================= INIT ================= */

  ngOnInit() {
    this.user = this.authService.getCurrentUser();

    this.form = this.fb.group({
      enable_safes: [false],
      enable_safes_drop: [false],
      currency: ['', Validators.required],
      enable_cashback: [false],
      enable_service_charge: [false],
      enable_loyalty_points: [false]
    });
  }

  /**
   * IMPORTANT:
   * Runs every time you enter screen
   */
  ionViewWillEnter() {
    this.loadSettings();
    this.loadCategories();
    this.loadTags();
  }

  /* ================= LOAD SETTINGS ================= */

  async loadSettings() {
    this.isLoadingSettings = true;


    try {
      const res = await this.authService.getCashSettings();
      const data = res.data;
      console.log('Loaded POS Settings', data.data);
      this.settings.address = {
        pinaka_pos_name: data.shop_info.pinaka_pos_name,
        pinaka_pos_email: data.shop_info.pinaka_pos_email,
        pinaka_pos_phone: data.shop_info.pinaka_pos_phone,
        pinaka_pos_business_address: data.shop_info.pinaka_pos_business_address,
        pinaka_pos_business_city: data.shop_info.pinaka_pos_business_city,
        pinaka_pos_business_state: data.shop_info.pinaka_pos_business_state,
        pinaka_pos_business_postcode: data.shop_info.pinaka_pos_business_postcode
      }
      this.settings.enableTaxes = data.tax_enabled == 1;
      this.settings.enableCoupons = data.coupons_enabled == 1;
      this.settings.sequentialCoupons = data.calc_sequential_coupons == 1;

      this.settings.enable_safes = !!data.enable_safes;
      this.settings.enable_safes_drop = !!data.enable_safes_drop;

      // 🔥 Missing in your code (IMPORTANT)
      this.settings.enable_loyalty_points = !!data.pinaka_pos_enable_loyalty_points;

      // cashback
      this.settings.enable_cashback = data.pinaka_pos_cashback_settings?.enabled == 1;

      // service charge
      this.settings.enable_service_charge = data.pinaka_pos_service_charge_settings?.enabled == 1;
      

    } catch (err) {
      console.error('Settings load failed', err);
    } finally {
      setTimeout(() => {
        this.isLoadingSettings = false;
      }, 300);
    }
  }

  async onCurrencyChange() {

    if (this.isLoadingSettings) return;   // ✅ prevent auto trigger

    const currency = this.form.value.currency;

    try {
      await this.authService.updateStoreCurrency(currency);

      this.presentToast('Currency updated successfully');

    } catch (error) {
      console.error(error);
      this.presentToast('Failed to update', 'danger');
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
  /* ================= TOAST ================= */

  async presentToast(message: string, color: any = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    toast.present();
  }

  async loadTags() {
    try {
      const res = await this.authService.getTags();
      this.tags = res.map((tag: any) => tag.name);
    } catch (err) {
      console.error('Failed to load product tags', err);
    }
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

  /* ================= TOGGLE HANDLER ================= */

  async onToggleChange(event: any, key: string) {

    if (this.isLoadingSettings) return;

    const checked = event.detail.checked;
    this.settings[key] = checked;

    const value = checked ? 1 : 0;

    const apiMap: any = {

      enable_safes: () =>
        this.authService.updateEnableSafes({ enable_safes: value }),

      enable_safes_drop: () =>
        this.authService.updateEnableSafesDrop({ enable_safes_drop: value }),

      enable_cashback: () =>
        this.authService.updateCashback({ enable_cashback: value }),

      enable_service_charge: () =>
        this.authService.updateServiceCharge({ enable_service_charge: value }),

      enable_loyalty_points: () =>
        this.authService.updateLoyaltyPoints({
          enable_loyalty_points: checked ? 'yes' : 'no'
        }),
    };

    try {
      const res = await apiMap[key]();
      this.presentToast(res?.message || (checked ? 'Enabled' : 'Disabled'));
    } catch (error) {
      console.error(error);
      this.presentToast('Failed to update', 'danger');
    }
  }
  /* ================= SAVE CASH SETTINGS ================= */

  async save() {
    if (this.form.invalid) return;

    try {
      await this.authService.saveCashSettings(this.form.value);
      this.presentToast('Settings saved');
    } catch {
      this.presentToast('Failed to save', 'danger');
    }
  }

  signOut() {
    this.authService.logout();
  }
}