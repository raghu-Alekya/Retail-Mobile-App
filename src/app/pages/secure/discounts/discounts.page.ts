import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import axios from 'axios';
import { ApiConfigService } from 'src/app/services/api-config.service';
@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.page.html',
  styleUrls: ['./discounts.page.scss'],
})
export class DiscountsPage implements OnInit {
    filteredDiscounts: any[] = [];
    activeFilter: string = 'all';
    loading = false;
    showForm = false;
    editingCoupon: any = null;
    page = 1;
    perPage = 10;
    hasMore = true;
    discounts: any[] = [];
    grouped: any = {};
    productSearch = '';
    productSuggestions: any[] = [];
    showSuggestions = false;
    selectedProductName = '';
    searchTimeout: any;
    type: string = '';
    filter_type: string = '';
    selectedProductPrice: any;
    discountSearch = '';
    discountSuggestions: any[] = [];
    selectedDiscountProducts: any[] = [];
    validationError: string = '';
  
    form = {
      code: '',
      discount_type: 'percent',
      amount: '',
      date_starts : '',
      date_expires: '',
      pinaka_discount_auto_apply: 'no',
      usage_limit: '',
      product_id:'',
      product_label: null,
      type: '',
      qty: '',
      selectedProductPrice: '',
      discount_product_ids: []
    };

    
  
    formSubmitted = false;
    constructor(
      private auth: AuthService,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private apiConfig: ApiConfigService
    ) {}
    wpBases = this.apiConfig.getBaseUrl();
  ngOnInit() {
    this.loadDiscounts();
  }
  
  apiUrl = `${this.wpBases}/wp-json/pinaka-pos/v1/custom-discount/get-all-discounts-for-admin`;
  async loadDiscounts() {
    try {
      this.loading = true;
      const res = await axios.get(this.apiUrl, {
        headers: this.getAuthHeaders(),
        params: {
          page: 1,
          per_page: 200
        }
      });
      this.grouped = res.data?.data || {};
      this.discounts = this.flattenAll();
    } catch (err) {
      this.presentToast('Failed to load discounts');
    } finally {
      this.loading = false;
    }
  }
  setFilter(type: string) {
    this.activeFilter = type;
    if (type === 'all') {
      this.discounts = this.flattenAll();
    } else {
      this.discounts = this.grouped[type] || [];
    }
  }
  onDiscountTypeChange(event: any)
  {
    const value = event.target.value?.trim();
    this.activeFilter = value;
  }
  onProductSearch(event: any) {
    const value = event.target.value?.trim();
    clearTimeout(this.searchTimeout);
    if (!value) {
      this.showSuggestions = false;
      this.productSuggestions = [];
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.fetchProducts(value);
    }, 300);
  }

  async fetchProducts(query: string) {
    try {
      const res = await axios.get(
        `${this.wpBases}/wp-json/wc/v3/products?search=${query}&per_page=10`,
        {
          headers: this.getAuthHeaders()
        }
      );

      this.productSuggestions = res.data || [];
      this.showSuggestions = true;
    } catch (err) {
      console.error('Product search failed', err);
    }
  }

  selectProduct(p: any) {
    this.form.product_id = p.id;
    this.selectedProductName = p.name;
    this.form.selectedProductPrice = p.price;
    this.productSearch = p.name;
    this.showSuggestions = false;
  }
  async onDiscountSearch(event: any) {
    clearTimeout(this.searchTimeout);
    const term =
    event?.detail?.value ??
    event?.target?.value ??
    '';
    this.searchTimeout = setTimeout(async () => {
      if (!term || term.length < 2) {
        this.discountSuggestions = [];
        return;
      }
      try {
        const res: any = await this.auth.searchProducts(term);
        this.discountSuggestions = res?.data || [];
      } catch (e) {
        console.error('Discount product search failed', e);
        this.discountSuggestions = [];
      }
    }, 300);
  }

  selectDiscountProduct(product: any) {
    if (this.selectedDiscountProducts.find(p => p.id === product.id)) return;

    this.selectedDiscountProducts.push(product);
    this.form.discount_product_ids =
      this.selectedDiscountProducts.map(p => p.id);

    this.discountSearch = '';
    this.discountSuggestions = [];
  }
  removeDiscountProduct(id: number) {
    this.selectedDiscountProducts =
      this.selectedDiscountProducts.filter(p => p.id !== id);

    this.form.discount_product_ids =
      this.selectedDiscountProducts.map(p => p.id);
  }

  flattenAll(): any[] {
    const all: any[] = [];

    Object.keys(this.grouped).forEach(key => {
      if (Array.isArray(this.grouped[key])) {
        all.push(...this.grouped[key]);
      }
    });

    return all;
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredDiscounts = [...this.discounts];
      return;
    }
    this.filteredDiscounts = this.discounts.filter(d => {
      const raw =
        (d.type || '')
          .toString()
          .toLowerCase()
          .trim();
      const normalized = raw
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      return normalized === this.activeFilter;
    });
  }
  
    openCreate() {
      this.resetForm();
      this.showForm = true;
      this.productSearch = '';
      this.selectedProductName = '';
      this.discountSearch = '';
      this.discountSuggestions = [];
      this.selectedDiscountProducts = [];
      this.form.discount_product_ids = [];
      this.filter_type = '';
      this.activeFilter = '';
    }
  
    async openEdit(coupon: any) {
      // console.log(coupon);
      this.filter_type = coupon.type;
      this.editingCoupon = coupon;
      this.form = {
        code: coupon.code,
        discount_type: coupon.discount_type,
        amount: coupon.coupon_amount,
        date_starts : coupon.start_date?.substring(0, 10),
        date_expires: coupon.expiry_date?.substring(0, 10),
        pinaka_discount_auto_apply: coupon.pinaka_discount_auto_apply,
        usage_limit: coupon.usage_limit,
        product_id: coupon.product_id,
        product_label: coupon.product_label,
        selectedProductPrice: coupon.selectedProductPrice,
        type: coupon.type,
        qty: coupon.qty,
        discount_product_ids: coupon.discount_product_ids
      };
      this.showSuggestions = false;
      this.productSuggestions = [];

      if (coupon.product_label) {
        this.restoreProduct(coupon.product_label);
      } else {
        this.productSearch = '';
        this.selectedProductName = '';
      }
      if (coupon.discount_product_ids?.length) {
        try {
          const res: any = await this.auth.getProductsByIds(
            coupon.discount_product_ids
          );
          this.selectedDiscountProducts = res?.data?.data || [];
        } catch (e) {
          console.error('Failed to load discounted products', e);
        }
      }
      this.showForm = true;
    }
    async restoreProduct(query: string) {
      try {
        const res = await axios.get(
        `${this.wpBases}/wp-json/wc/v3/products?search=${query}&per_page=10`,
        {
          headers: this.getAuthHeaders()
        }
      );
        if (res.data && res.data.length) {
          const p = res.data[0];
          this.selectedProductName = p.name;
          this.productSearch = p.name;
        }
      } catch (e) {
        console.error('Restore product failed', e);
      }
    }
    async saveCoupon() {
      this.formSubmitted = true;

      if (!this.isFormValid()) {
        return;
      }
      let prevfilter = this.activeFilter;
      if (this.editingCoupon) {
        await this.auth.updateDiscount(this.editingCoupon.id, this.form);
      } else {
        await this.auth.createDiscount(this.form);
        prevfilter = 'all';
      }
      
      this.showForm = false;
      this.resetForm();     
      await this.loadDiscounts();
      this.setFilter(prevfilter);
    }
    isFormValid(): boolean {
      const f = this.form;
      if (!f.product_id) {
        this.showValidationError('Please select a product');
        return false;
      }
      if (f.type === 'mix_match') {
        if (!f.discount_product_ids || f.discount_product_ids.length === 0) {
          this.showValidationError(
            'Please select at least one product for Mix & Match discount'
          );
          return false;
        }
      }
      if (!f.type || !f.type.trim()) {
        this.showValidationError('Please select a discount type');
        return false;
      }
      if (f.type !== 'multipack') {
        if (!f.code || !f.code.trim()) {
          this.showValidationError('Please enter a discount code');
          return false;
        }
      }
      if (f.type === 'multipack') {
        if (!f.qty || Number(f.qty) <= 0) {
          this.showValidationError('Please enter valid quantity for multipack');
          return false;
        }
      }
      const amount = Number(f.amount);
      if (
        f.amount === '' ||
        f.amount === null ||
        f.amount === undefined ||
        isNaN(amount) ||
        amount <= 0
      ) {
        this.showValidationError('Discount amount must be greater than 0');
        return false;
      }
      if (f.discount_type === 'percent' && amount > 100) {
        this.showValidationError('Percentage discount cannot exceed 100%');
        return false;
      }
      if(!f.date_starts)
      {
        this.showValidationError('start date is required');
        return false;
      }
      if(!f.date_expires)
      {
        this.showValidationError('end date is required');
        return false;
      }
      if (f.date_starts && f.date_expires) {
        if (new Date(f.date_expires) < new Date(f.date_starts)) {
          this.showValidationError('Expiry date cannot be before start date');
          return false;
        }
      }
      if (
        (f.type === 'multipack' || f.type === 'auto') &&
        (!f.usage_limit || Number(f.usage_limit) < 0)
      ) {
        this.showValidationError('Usage limit is required and cannot be negative');
        return false;
      }
      return true;
    }
    async showValidationError(message: string) {
      const toast = await this.toastCtrl.create({
        message,
        duration: 2500,
        color: 'danger',
        position: 'bottom'
      });
      toast.present();
    }
    async deleteCoupon(coupon: any) {
      const alert = await this.alertCtrl.create({
        header: 'Delete Discount?',
        message: `Delete discount <b>${coupon.code}</b>?`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Delete',
            role: 'destructive',
            handler: async () => {
              await this.auth.deleteDiscount(coupon.id, this.activeFilter);
              const prevfilters = this.activeFilter;
              await this.loadDiscounts();
              this.setFilter(prevfilters);
            }
          }
        ]
      });
      alert.present();
    }
    resetForm() {
      this.formSubmitted = false;
      this.editingCoupon = null;
      this.form = {
        code: '',
        discount_type: 'percent',
        amount: '',
        date_starts: '',
        date_expires: '',
        pinaka_discount_auto_apply: 'no',
        usage_limit: '',
        product_id:'',
        product_label:null,
        type: '',
        qty: '',
        selectedProductPrice: '',
        discount_product_ids : []
      };
    }
    async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
  getAuthHeaders() {
    const token = localStorage.getItem('wc_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
}