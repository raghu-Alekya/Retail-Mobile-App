import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.page.html',
  styleUrls: ['./discounts.page.scss'],
})
export class DiscountsPage {

    loading = false;
    showForm = false;
    editingCoupon: any = null;
    page = 1;
    perPage = 10;
    hasMore = true;
    discounts: any[] = [];
    form = {
      code: '',
      discount_type: 'percent',
      amount: '',
      date_expires: '',
      individual_use: false,
      usage_limit: '',
      description: ''
    };
  
    formSubmitted = false;
    constructor(
      private auth: AuthService,
      private alertCtrl: AlertController,
      private modalController: ModalController
    ) {}
  
    ionViewWillEnter() {
      this.loadCoupons();
    }
  
    async loadCoupons(event?: any, reset: boolean = false) {
      if (this.loading || (!reset && !this.hasMore)) return;

      this.loading = true;

      try {
        // Reset data and pagination if requested
        if (reset) {
          this.discounts = [];
          this.page = 1;
          this.hasMore = true;
        }

        const res = await this.auth.getDiscounts(this.page, this.perPage);
        const data = res.data;

        if (reset) {
          this.discounts = data.data;
        } else {
          this.discounts = [...this.discounts, ...data.data];
        }

        // pagination handling
        this.hasMore = data.pagination.has_more;
        this.page++;

      } catch (err) {
        console.error('Failed to load discounts', err);
        this.hasMore = false;
      }

      this.loading = false;
      if (event) event.target.complete();
    }
  
    openCreate() {
      this.resetForm();
      this.showForm = true;
    }
  
    openEdit(coupon: any) {
      this.editingCoupon = coupon;
      this.form = {
        code: coupon.code,
        discount_type: coupon.discount_type,
        amount: coupon.coupon_amount,
        date_expires: coupon.expiry_date?.substring(0, 10),
        individual_use: coupon.individual_use,
        usage_limit: coupon.usage_limit,
        description: coupon.description
      };
      this.showForm = true;
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
      
      // Reset and reload the list
      this.loadCoupons(null, true); // Pass true to reset
    }
  
    isFormValid(): boolean {
      return (
        this.form.code.trim() !== '' &&
        this.form.amount !== '' &&
        Number(this.form.amount) > 0
      );
    }
  
    hasError(field: string): boolean {
      if (!this.formSubmitted) return false;
  
      switch (field) {
        case 'code':
          return !this.form.code.trim();
        case 'amount':
          return !this.form.amount || Number(this.form.amount) <= 0;
        default:
          return false;
      }
    }
  
  
    async deleteCoupon(coupon: any) {
      const alert = await this.alertCtrl.create({
        header: 'Delete Coupon?',
        message: `Delete coupon <b>${coupon.code}</b>?`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Delete',
            role: 'destructive',
            handler: async () => {
              await this.auth.deleteCoupon(coupon.id);
              // Reset and reload the list after deletion
              this.loadCoupons(null, true);
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
        date_expires: '',
        individual_use: false,
        usage_limit: '',
        description: ''
      };
    }
}
