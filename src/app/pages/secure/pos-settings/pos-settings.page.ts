import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AlertController } from '@ionic/angular';

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
    address: {
      pinaka_pos_name: '',
      pinaka_pos_email: '',
      pinaka_pos_phone: '',
      pinaka_pos_business_address: '',
      pinaka_pos_business_city: '',
      pinaka_pos_business_state: '',
      pinaka_pos_business_postcode: ''
    },
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
    private toastController: ToastController,
    private alertController: AlertController
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
      const data = res?.data?.data || res?.data || res;

      if (!data) return;

      const toBool = (v: any) => v === true || v === 1 || v === "1";

      this.settings.address = {
        pinaka_pos_name: data.shop_info.pinaka_pos_name,
        pinaka_pos_email: data.shop_info.pinaka_pos_email,
        pinaka_pos_phone: data.shop_info.pinaka_pos_phone,
        pinaka_pos_business_address: data.shop_info.pinaka_pos_business_address,
        pinaka_pos_business_city: data.shop_info.pinaka_pos_business_city,
        pinaka_pos_business_state: data.shop_info.pinaka_pos_business_state,
        pinaka_pos_business_postcode: data.shop_info.pinaka_pos_business_postcode
      }

      this.settings.enable_safes = toBool(data.enable_safes);
      this.settings.enable_safes_drop = toBool(data.enable_safes_drop);

      this.settings.enableTaxes = toBool(data.tax_enabled);
      this.settings.enableCoupons = toBool(data.coupons_enabled);
      this.settings.sequentialCoupons = toBool(data.calc_sequential_coupons);

      this.settings.currency = data.selected_currency;
      this.currencies = data.currencies;

      setTimeout(() => {
        this.form.patchValue({
          currency: this.settings.currency
        });
      });

      // backend keys
      // this.settings.enable_cashback =
      //   toBool(data.pinaka_pos_cashback_settings);

      // this.settings.enable_service_charge =
      //   toBool(data.pinaka_pos_service_charge_settings);

      this.settings.enable_cashback =
        toBool(data.pinaka_pos_cashback_settings?.enabled);

      this.settings.enable_service_charge =
        toBool(data.pinaka_pos_service_charge_settings?.enabled);

      this.settings.enable_loyalty_points =
        !!data.pinaka_pos_enable_loyalty_points;

      this.settings.currency_symbol = data.currency_symbol || '';

    } catch (err) {
      console.error('Settings load failed', err);
    } finally {
      setTimeout(() => {
        this.isLoadingSettings = false;
      }, 300);
    }
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

  const payload = {
    name: this.newCategory.trim()
  };

  try {

    const response = await this.authService.saveCategory(payload);

    console.log("CATEGORY RESPONSE:", response);

    this.categories.push({
      id: response.id,
      name: response.name
    });

    this.newCategory = '';

    await this.presentToast('Category created successfully', 'success');

  } catch (err) {
    console.error(err);
    await this.presentToast('Failed to create category', 'danger');
  }
}

  async removeCategory(category_id: number) {

    const alert = await this.alertController.create({
      header: 'Delete Category',
      message: 'Are you sure you want to delete this category?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteCategory(category_id);
          }
        }
      ]
    });

    await alert.present();
  }


  async deleteCategory(category_id:number){

    try {

      await this.authService.deleteCategory(category_id);

      this.categories = this.categories.filter(
        cat => cat.id !== category_id
      );

      await this.presentToast('Category deleted successfully','success');

    } catch (err) {

      console.error(err);

      await this.presentToast('Failed to delete category','danger');

    }

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

  async removeTag(tag: string) {

    const alert = await this.alertController.create({
      header: 'Delete Tag',
      message: 'Are you sure you want to delete this tag?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteTag(tag);
          }
        }
      ]
    });

    await alert.present();
  }


  deleteTag(tag:string){

    this.tags = this.tags.filter(t => t !== tag);

    const payload = {
      product_tags: this.tags
    };

    console.log('Remove Tag Payload', payload);

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

        enableTaxes: () =>
        this.authService.enableTaxes({
          enable_taxes: value
        }),

        enableCoupons: () =>
        this.authService.enableCoupons({
          enable_coupons: value
        }),

        sequentialCoupons: () =>
        this.authService.sequentialCoupons({
          coupon_sequential: value
        }),
    };

    try {
      const res = await apiMap[key]();
     this.presentToast(
  key === 'enableTaxes'
    ? checked ? 'Taxes enabled' : 'Taxes disabled'
    : (checked ? 'Enabled' : 'Disabled')
);
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