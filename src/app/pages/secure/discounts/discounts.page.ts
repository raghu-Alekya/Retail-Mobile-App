import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import axios from 'axios';
import { ApiConfigService } from 'src/app/services/api-config.service';
@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.page.html',
  styleUrls: ['./discounts.page.scss'],
})
export class DiscountsPage implements OnInit {
    wpBases = '';
    apiUrl = `${this.wpBases}/wp-json/pinaka-pos/v1/custom-discount/get-all-discounts-for-admin`;
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
    selectedProductPrice: number | null = null;
    discountSearch = '';
    discountSuggestions: any[] = [];
    selectedDiscountProducts: any[] = [];
    
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
    wpBase = this.apiConfig.getBaseUrl();
  ngOnInit() {
    this.loadDiscounts();
  }
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
        `${this.wpBase}/wp-json/wc/v3/products?search=${query}&per_page=10`,
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
        console.log(this.discountSuggestions);
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
        selectedProductPrice: coupon.product_price,
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
        `${this.wpBase}/wp-json/wc/v3/products?search=${query}&per_page=10`,
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

      if (this.editingCoupon) {
        await this.auth.updateDiscount(this.editingCoupon.id, this.form);
      } else {
        await this.auth.createDiscount(this.form);
      }

      this.showForm = false;
      this.resetForm();      
      this.loadDiscounts();
    }
  
    isFormValid(): boolean {
      return (
        this.activeFilter === 'multipack'
      ? true
      : !!this.form.code?.trim() &&
        this.form.amount !== '' &&
        Number(this.form.amount) > 0
      );
    }
  
    hasError(field: string): boolean {
      if (!this.formSubmitted) return false;
      console.log(this.activeFilter);
      switch (field) {
        case 'type':
          return !this.form.type.trim();
        case 'code':
          if (this.activeFilter === 'multipack') {
            return false;
          }
          return !this.form.code?.trim();
        case 'amount':
          return !this.form.amount || Number(this.form.amount) <= 0;
        default:
          return false;
      }
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
              this.loadDiscounts();
              
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