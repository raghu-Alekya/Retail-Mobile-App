import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
@Component({
  standalone: true,
  selector: 'app-coupons',
  templateUrl: './coupons.page.html',
  styleUrls: ['./coupons.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CouponsPage {

  coupons: any[] = [];
  loading = false;
  showForm = false;
  editingCoupon: any = null;

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
    private alertCtrl: AlertController
  ) {}

  // ionViewWillEnter() {
  //   this.loadCoupons();
  // }
  ionViewWillEnter() {
    const state = history.state;
    if (state?.autoOpenCreate) {
      this.openCreate();

      history.replaceState({}, '');
    }
    this.loadCoupons();
  }

  async loadCoupons() {
    this.loading = true;
    try {
      this.coupons = await this.auth.getCoupons();
    } finally {
      this.loading = false;
    }
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
      amount: coupon.amount,
      date_expires: coupon.date_expires?.substring(0, 10),
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
      await this.auth.updateCoupon(this.editingCoupon.id, this.form);
    } else {
      await this.auth.createCoupon(this.form);
    }

    this.showForm = false;
    this.resetForm();
    this.loadCoupons();
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
            this.loadCoupons();
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
