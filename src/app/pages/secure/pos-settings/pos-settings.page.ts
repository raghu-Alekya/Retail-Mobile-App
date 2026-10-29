import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
    selector: 'app-pos-settings',
    templateUrl: './pos-settings.page.html',
    styleUrls: ['./pos-settings.page.scss'],
    standalone: false
})
export class PosSettingsPage implements OnInit {

  form!: FormGroup;
  user: any;
  isLoadingSettings = false;
  isLoadingCashSettings = false;
  isSavingSafes = false;
  savingToggles: Record<string, boolean> = {};
  private savedToggleValues: Record<string, boolean> = {};
  private savedSafesValue = false;
  cashSettingsError = '';
  private cashSettingsRequestId = 0;
  private cashSettingsContext = '';
  shopAddressError = '';
  isSavingAddress = false;
  private storeCurrency = '';
  private storeTimezone = '';
  isLoadingTaxonomies = false;
  taxonomyError = '';
  private taxonomyRequestId = 0;
  private taxonomyStoreId = '';
  private addressRequestId = 0;
  private addressStoreId = '';
  emailError: string = '';
  phoneError: string = '';
  isAddingCategory = false;
  categoryBusy: Record<number, boolean> = {};
  isAddingTag = false;
  tagBusy: Record<number, boolean> = {};
  storeNameError: string = '';
cityError: string = '';
stateError: string = '';
emailEmojiError: string = '';
addressError: string = '';
categoryError: string = '';
tagError: string = '';

  settings: any = {
    address: {
      pinaka_pos_name: '',
      pinaka_pos_email: '',
      pinaka_pos_phone: '',
      pinaka_pos_business_address: '',
      pinaka_pos_business_address_line2: '',
      pinaka_pos_business_city: '',
      pinaka_pos_business_state: '',
      pinaka_pos_business_postcode: '',
      country: ''
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
  tags: { id: number; name: string }[] = [];

  newCategory = '';
  newTag = '';
  currencies: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  validateEmail() {
  const email = this.settings.address.pinaka_pos_email;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email && !emailRegex.test(email)) {
    this.emailError = 'Please enter a valid email address';
  } else {
    this.emailError = '';
  }
}

onPhoneInput(event: any) {
  let value = event.target.value || '';

  value = value.replace(/\D/g, '');
  value = value.substring(0, 10);

  this.settings.address.pinaka_pos_phone = value;

  this.validatePhone();
}

validatePhone() {
  const phone = this.settings.address.pinaka_pos_phone || '';

  if (phone.length === 0) {
    this.phoneError = '';
  } else if (phone.length !== 10) {
    this.phoneError = 'Phone number must be exactly 10 digits';
  } else {
    this.phoneError = '';
  }
}

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
    void this.loadSettings();
    if (this.authService.isMerchantSession()) void this.loadTaxonomies();
  }

  /**
   * IMPORTANT:
   * Runs every time you enter screen
   */
  ionViewWillEnter() {
    this.loadSettings();
    if (this.authService.isMerchantSession()) void this.loadTaxonomies();
    else { this.loadCategories(); this.loadTags(); }
  }

  /* ================= LOAD SETTINGS ================= */

  private applyShopAddress(store: any) {
    this.storeCurrency = store.currency || '';
    this.storeTimezone = store.timezone || '';
    this.settings.address = {
      pinaka_pos_name: store.storeName || '', pinaka_pos_email: store.storeEmail || '',
      pinaka_pos_phone: store.phone || '', pinaka_pos_business_address: store.addressLine1 || '',
      pinaka_pos_business_address_line2: store.addressLine2 || '',
      pinaka_pos_business_city: store.city || '', pinaka_pos_business_state: store.state || '',
      pinaka_pos_business_postcode: store.postalCode || '', country: store.country || ''
    };
  }

  private async savePchShopAddress() {
    this.isSavingAddress = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const storeId = JSON.parse(storeSnapshot || 'null')?.id || '';
      if (storeId !== this.addressStoreId || this.shopAddressError) throw new Error('Reload the shop address before saving.');
      const address = this.settings.address;
      const payload = {
        name: address.pinaka_pos_name.trim(), store_email: address.pinaka_pos_email.trim(),
        phone: address.pinaka_pos_phone.trim(), address_line1: address.pinaka_pos_business_address.trim(),
        address_line2: (address.pinaka_pos_business_address_line2 || '').trim(),
        city: address.pinaka_pos_business_city.trim(), state: address.pinaka_pos_business_state.trim(),
        postal_code: address.pinaka_pos_business_postcode.trim(), country: address.country.trim(),
        ...(this.storeCurrency ? { currency: this.storeCurrency } : {}),
        ...(this.storeTimezone ? { timezone: this.storeTimezone } : {})
      };
      const result = await this.authService.updatePchStoreAddress(storeId, payload);
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.applyShopAddress(result.store);
      const selected = JSON.parse(storeSnapshot || 'null');
      if (selected) localStorage.setItem('selected_store', JSON.stringify({ ...selected, storeName: result.store.storeName }));
      try {
        const stores = JSON.parse(localStorage.getItem('merchant_stores') || '[]');
        if (Array.isArray(stores)) localStorage.setItem('merchant_stores', JSON.stringify(stores.map(store => store.id === storeId ? { ...store, storeName: result.store.storeName } : store)));
      } catch {}
      await this.presentToast(result.message, 'success');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Failed to update shop address.', 'danger');
    } finally {
      this.isSavingAddress = false;
    }
  }

  async loadShopAddress() {
    let storeId = '';
    try { storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || ''; } catch {}
    if (this.isLoadingSettings && this.addressStoreId === storeId) return;
    const requestId = ++this.addressRequestId;
    this.addressStoreId = storeId;
    this.isLoadingSettings = true;
    this.shopAddressError = '';
    Object.keys(this.settings.address).forEach(key => this.settings.address[key] = '');
    try {
      const store = await this.authService.getPchStoreDetails(storeId);
      if (requestId !== this.addressRequestId) return;
      this.applyShopAddress(store);
    } catch (error: any) {
      if (requestId === this.addressRequestId) this.shopAddressError = error?.message || 'Unable to load shop address.';
    } finally {
      if (requestId === this.addressRequestId) this.isLoadingSettings = false;
    }
  }

  async loadCashToggles() {
    let merchantId = '';
    let storeId = '';
    try {
      merchantId = JSON.parse(localStorage.getItem('merchant_data') || 'null')?.id || '';
      storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || '';
    } catch {}
    const context = merchantId + ':' + storeId;
    if (this.isLoadingCashSettings && this.cashSettingsContext === context) return;
    const requestId = ++this.cashSettingsRequestId;
    this.cashSettingsContext = context;
    this.isLoadingCashSettings = true;
    this.cashSettingsError = '';
    const keys = ['enable_safes', 'enable_safes_drop', 'enableTaxes', 'enableCoupons', 'sequentialCoupons', 'enable_cashback', 'enable_service_charge', 'enable_loyalty_points'];
    keys.forEach(key => this.settings[key] = false);
    this.settings.currency = '';
    this.settings.currency_symbol = '';
    this.currencies = {};
    try {
      const [flags, currencyData] = await Promise.all([
        this.authService.getPchConfigurationFlags(merchantId, storeId),
        this.authService.getPchCashSettings(merchantId, storeId).catch(() => null)
      ]);
      const data = currencyData || {};
      if (requestId !== this.cashSettingsRequestId) return;
      const toBool = (value: any) => value === true || value === 1 || value === '1' || value === 'true';
      Object.assign(this.settings, {
        enable_safes: toBool(flags.enable_safes), enable_safes_drop: toBool(flags.enable_safes_drop),
        enableTaxes: toBool(flags.tax_enabled), enableCoupons: toBool(data.coupons_enabled),
        sequentialCoupons: toBool(data.calc_sequential_coupons),
        enable_cashback: toBool(flags.cashback_enabled),
        enable_service_charge: toBool(data.pinaka_pos_service_charge_settings?.enabled),
        enable_loyalty_points: toBool(data.pinaka_pos_enable_loyalty_points),
        currency: data.selected_currency || '', currency_symbol: data.currency_symbol || ''
      });
      this.savedSafesValue = this.settings.enable_safes;
      ['enable_safes_drop', 'enableTaxes', 'enableCoupons', 'sequentialCoupons', 'enable_cashback', 'enable_service_charge', 'enable_loyalty_points'].forEach(key => this.savedToggleValues[key] = this.settings[key]);
      this.currencies = data.currencies || {};
      this.form.patchValue({
        enable_safes: this.settings.enable_safes, enable_safes_drop: this.settings.enable_safes_drop,
        enable_cashback: this.settings.enable_cashback, enable_service_charge: this.settings.enable_service_charge,
        enable_loyalty_points: this.settings.enable_loyalty_points, currency: this.settings.currency
      }, { emitEvent: false });
    } catch (error: any) {
      if (requestId === this.cashSettingsRequestId) this.cashSettingsError = error?.message || 'Unable to load shop settings.';
    } finally {
      if (requestId === this.cashSettingsRequestId) this.isLoadingCashSettings = false;
    }
  }

  async loadSettings() { 
    if (this.authService.isMerchantSession()) {
      await Promise.all([this.loadShopAddress(), this.loadCashToggles()]);
      return;
    }
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
    if (this.isSavingAddress || this.isLoadingSettings) return;

    if (
  this.storeNameError ||
  this.emailEmojiError ||
  this.addressError ||
  this.cityError ||
  this.stateError
) {
  await this.presentToast(
    'Please remove emojis from the fields',
    'danger'
  );
  return;
}
    this.validateEmail(); // 👈 run validation first
    this.validatePhone();

    if (this.emailError || this.phoneError) {
      await this.presentToast(
        this.emailError || this.phoneError,
        'danger'
      );
      return;
    }
    if (this.authService.isMerchantSession()) { await this.savePchShopAddress(); return; }
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

    if (this.isLoadingSettings || this.isLoadingCashSettings) return;   // ✅ prevent auto trigger

    const currency = this.form.value.currency;

    try {
      await this.authService.updateStoreCurrency(currency);

      this.presentToast('Currency updated successfully');

    } catch (error) {
      console.error(error);
      this.presentToast('Failed to update', 'danger');
    }
  }
  async loadTaxonomies() {
    let storeId = '';
    try { storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || ''; } catch {}
    if (this.isLoadingTaxonomies && this.taxonomyStoreId === storeId) return;
    const requestId = ++this.taxonomyRequestId;
    this.taxonomyStoreId = storeId;
    this.isLoadingTaxonomies = true;
    this.taxonomyError = '';
    this.categories = [];
    this.tags = [];
    try {
      const data = await this.authService.getPchStoreTaxonomies(storeId);
      if (requestId !== this.taxonomyRequestId) return;
      this.categories = data.categories.map(category => ({ ...category, id: category.id, name: category.name }));
      this.tags = data.tags.map(tag => ({ ...tag, id: tag.id, name: tag.name }));
    } catch (error: any) {
      if (requestId === this.taxonomyRequestId) this.taxonomyError = error?.message || 'Unable to load product categories and tags.';
    } finally {
      if (requestId === this.taxonomyRequestId) this.isLoadingTaxonomies = false;
    }
  }

  async loadCategories() {
    if (this.authService.isMerchantSession()) { await this.loadTaxonomies(); return; }
    try {
      const res = await this.authService.getCategories(1, 100);
      this.categories = res.map((cat: any) => ({ name: cat.name, id: cat.id }));
    } catch (err) {
      console.error('Failed to load product categories', err);
    }
  }

  async addCategory() {

    if (this.categoryError) {
    this.presentToast('Please remove emojis from category name', 'danger');
    return;
  }

  if (this.isAddingCategory) return;

  const name = this.newCategory.trim();

  if (!name) return;

  // ✅ DUPLICATE CHECK
  const alreadyExists = this.categories.some(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    await this.presentToast('Category already exists', 'warning');
    return;
  }

  this.isAddingCategory = true;

  const payload = { name, slug: this.createSlug(name), description: '', parent: 0 };
  const storeSnapshot = localStorage.getItem('selected_store');

  try {
    const response = await this.authService.saveCategory(payload);

    if (localStorage.getItem('selected_store') !== storeSnapshot) return;
    this.categories.push({
      id: response.id,
      name: response.name
    });

    this.newCategory = '';

    await this.presentToast(response.pchSyncWarning || 'Category created successfully', response.pchSyncWarning ? 'warning' : 'success');

  } catch (err: any) {
    await this.presentToast(err?.message || 'Failed to create category', 'danger');
  } finally {
    this.isAddingCategory = false;
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


  async deleteCategory(category_id: number) {
    if (this.categoryBusy[category_id]) return;
    this.categoryBusy[category_id] = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const response = await this.authService.deleteCategory(category_id);
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.categories = this.categories.filter(category => category.id !== category_id);
      await this.presentToast(response.pchSyncWarning || 'Category deleted successfully', response.pchSyncWarning ? 'warning' : 'success');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Failed to delete category', 'danger');
    } finally { this.categoryBusy[category_id] = false; }
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
    if (this.authService.isMerchantSession()) { await this.loadTaxonomies(); return; }
    try {
      const res = await this.authService.getTags();
      this.tags = res.map((tag: any) => ({
  id: tag.id,
  name: tag.name
}));
    } catch (err) {
      console.error('Failed to load product tags', err);
    }
  }

  /* =====================
     PRODUCT TAGS
     ===================== */

  async addTag() {

    if (this.tagError) {
    this.presentToast('Please remove emojis from tag name', 'danger');
    return;
  }

  if (this.isAddingTag) return;

  const name = this.newTag.trim();

  if (!name) return;

  // ✅ DUPLICATE CHECK
  const alreadyExists = this.tags.some(
    tag => tag.name.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    await this.presentToast('Tag already exists', 'warning');
    return;
  }

  this.isAddingTag = true;

  const payload = { name, slug: this.createSlug(name), description: '' };
  const storeSnapshot = localStorage.getItem('selected_store');

  try {
    const res = await this.authService.createTag(payload);

    if (localStorage.getItem('selected_store') !== storeSnapshot) return;
    this.tags.push({
      id: res.id,
      name: res.name
    });

    this.newTag = '';

    await this.presentToast(res.pchSyncWarning || 'Tag created successfully', res.pchSyncWarning ? 'warning' : 'success');

  } catch (err: any) {
    await this.presentToast(err?.message || 'Failed to create tag', 'danger');
  } finally {
    this.isAddingTag = false;
  }
}

  async removeTag(tag: { id: number; name: string }) {

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
            this.deleteTag(tag); // ✅ use id
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteTag(tag: any) {
    if (this.tagBusy[tag.id]) return;
    this.tagBusy[tag.id] = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const response = await this.authService.deleteTag(tag.id);
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.tags = this.tags.filter(item => item.id !== tag.id);
      await this.presentToast(response.pchSyncWarning || 'Tag deleted successfully', response.pchSyncWarning ? 'warning' : 'success');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Failed to delete tag', 'danger');
    } finally { this.tagBusy[tag.id] = false; }
  }

  /* ================= TOGGLE HANDLER ================= */

  private async savePchToggle(event: any, key: string) {
    if (this.savingToggles[key]) return;
    const previous = this.savedToggleValues[key] ?? false;
    const checked = !!event.detail.checked;
    if (checked === previous) return;
    this.savingToggles[key] = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const storeId = JSON.parse(storeSnapshot || 'null')?.id || '';
      const merchantId = JSON.parse(localStorage.getItem('merchant_data') || 'null')?.id || '';
      const result = await this.authService.updatePchSettingToggle(merchantId, storeId, key, checked);
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.savedToggleValues[key] = result.enabled;
      this.settings[key] = result.enabled;
      this.form.patchValue({ [key]: result.enabled }, { emitEvent: false });
      await this.presentToast(result.message, 'success');
    } catch (error: any) {
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.settings[key] = previous;
      this.form.patchValue({ [key]: previous }, { emitEvent: false });
      if (event.target) event.target.checked = previous;
      await this.presentToast(error?.message || 'Failed to update setting.', 'danger');
    } finally {
      this.savingToggles[key] = false;
    }
  }

  private async savePchSafes(event: any) {
    if (this.isSavingSafes) return;
    const previous = this.savedSafesValue;
    const checked = !!event.detail.checked;
    if (checked === previous) return;
    this.isSavingSafes = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const storeId = JSON.parse(storeSnapshot || 'null')?.id || '';
      const merchantId = JSON.parse(localStorage.getItem('merchant_data') || 'null')?.id || '';
      const result = await this.authService.updatePchSafes(merchantId, storeId, checked);
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.savedSafesValue = result.enabled;
      this.settings.enable_safes = result.enabled;
      this.form.patchValue({ enable_safes: result.enabled }, { emitEvent: false });
      await this.presentToast(result.message, 'success');
    } catch (error: any) {
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      this.settings.enable_safes = previous;
      this.form.patchValue({ enable_safes: previous }, { emitEvent: false });
      if (event.target) event.target.checked = previous;
      await this.presentToast(error?.message || 'Failed to update safes.', 'danger');
    } finally {
      this.isSavingSafes = false;
    }
  }

  async onToggleChange(event: any, key: string) {

    if (this.isLoadingCashSettings) return;

    if (key === 'enable_safes' && this.authService.isMerchantSession()) {
      await this.savePchSafes(event);
      return;
    }

    if (this.authService.isMerchantSession() && ['enable_safes_drop', 'enableTaxes', 'enableCoupons', 'sequentialCoupons', 'enable_cashback', 'enable_service_charge', 'enable_loyalty_points'].includes(key)) {
      await this.savePchToggle(event, key);
      return;
    }

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

  async editCategory(category: any) {

    const alert = await this.alertController.create({
      header: 'Edit Category',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: category.name
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
  text: 'Update',
  handler: async (data) => {

    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

if (emojiRegex.test(data.name)) {
  await this.presentToast(
    'Emojis are not allowed in category name',
    'danger'
  );
  return false; // keep alert open
}

    const newName = data.name.trim();

    if (!newName) return false;

    // ✅ DUPLICATE CHECK (exclude current category)
    const alreadyExists = this.categories.some(
      cat =>
        cat.id !== category.id &&   // 👈 important (ignore same item)
        cat.name.toLowerCase() === newName.toLowerCase()
    );

    if (alreadyExists) {
      await this.presentToast('Category already exists', 'warning');
      return false; // ❌ stop alert from closing
    }

    if (this.categoryBusy[category.id]) return false;
    this.categoryBusy[category.id] = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const result = await this.authService.updateCategory(category.id, { name: newName, slug: this.createSlug(newName) });
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      category.name = result.name;
      await this.presentToast(result.pchSyncWarning || 'Category updated successfully', result.pchSyncWarning ? 'warning' : 'success');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Failed to update category', 'danger');
      return false;
    } finally { this.categoryBusy[category.id] = false; }

  }
}
      ]
    });

    await alert.present();
  }

  async editTag(tag: any) {

    const alert = await this.alertController.create({
      header: 'Edit Tag',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: tag.name
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
  text: 'Update',
  handler: async (data) => {

    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(data.name)) {
    await this.presentToast(
      'Emojis are not allowed in tag name',
      'danger'
    );
    return false;
  }

    const newName = data.name.trim();

    if (!newName) return false;

    // ✅ DUPLICATE CHECK (ignore current tag)
    const alreadyExists = this.tags.some(
      t =>
        t.id !== tag.id &&   // 👈 important
        t.name.toLowerCase() === newName.toLowerCase()
    );

    if (alreadyExists) {
      await this.presentToast('Tag already exists', 'warning');
      return false; // ❌ keep alert open
    }

    if (this.tagBusy[tag.id]) return false;
    this.tagBusy[tag.id] = true;
    const storeSnapshot = localStorage.getItem('selected_store');
    try {
      const result = await this.authService.updateTag(tag.id, { name: newName, slug: this.createSlug(newName) });
      if (localStorage.getItem('selected_store') !== storeSnapshot) return;
      tag.name = result.name;
      await this.presentToast(result.pchSyncWarning || 'Tag updated successfully', result.pchSyncWarning ? 'warning' : 'success');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Failed to update tag', 'danger');
      return false;
    } finally { this.tagBusy[tag.id] = false; }

  }
}
      ]
    });

    await alert.present();
  }
  
  createSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
      .replace(/\s+/g, '-')           // replace spaces with -
      .replace(/-+/g, '-');           // remove duplicate -
  }

  onPostcodeInput(event: any) {
  let value = event.target.value || '';

  value = value.replace(/\D/g, ''); // numbers only
  value = value.substring(0, 6);    // max 6 digits

  this.settings.address.pinaka_pos_business_postcode = value;
}

onStoreNameInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.storeNameError = 'Emojis are not allowed';
  } else {
    this.storeNameError = '';
  }

  this.settings.address.pinaka_pos_name = value.replace(emojiRegex, '');
}

onEmailInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.emailEmojiError = 'Emojis are not allowed';
  } else {
    this.emailEmojiError = '';
  }

  this.settings.address.pinaka_pos_email =
    value.replace(emojiRegex, '');

  this.validateEmail();
}

onCityInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.cityError = 'Emojis are not allowed';
  } else {
    this.cityError = '';
  }

  this.settings.address.pinaka_pos_business_city =
    value.replace(emojiRegex, '');
}

onStateInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.stateError = 'Emojis are not allowed';
  } else {
    this.stateError = '';
  }

  this.settings.address.pinaka_pos_business_state =
    value.replace(emojiRegex, '');
}

onAddressInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.addressError = 'Emojis are not allowed';
  } else {
    this.addressError = '';
  }

  this.settings.address.pinaka_pos_business_address =
    value.replace(emojiRegex, '');
}

onCategoryInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.categoryError = 'Emojis are not allowed';
  } else {
    this.categoryError = '';
  }

  this.newCategory = value.replace(emojiRegex, '');
}

onTagInput(event: any) {
  const value = event.target.value || '';

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  if (emojiRegex.test(value)) {
    this.tagError = 'Emojis are not allowed';
  } else {
    this.tagError = '';
  }

  this.newTag = value.replace(emojiRegex, '');
}
}