import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { IonDatetime } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { pencil } from 'ionicons/icons';




addIcons({ pencil });

@Component({
  selector: 'app-add-coupon',
  templateUrl: './add-coupon.page.html',
  styleUrls: ['./add-coupon.page.scss'],
})
export class AddCouponPage {

  @ViewChild('datePicker', { static: false }) datePicker!: IonDatetime;

  editing: string | null = null;

  isDateModalOpen = false;
  isDirty = false;
  coupon: any = {
  code: '',
  description: '',
  amount: null,
  type: 'fixed_cart',
  individualUse: false,
  usageLimit: null,
  usageLimitPerUser: null,
  excludeSale: false,
  minAmount: null,
  maxAmount: null,
  expireDate: ''
};

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  startEdit(field: string) {
    this.editing = field;
  }

  stopEdit() {
    this.editing = null;
  }

  openDatePicker() {
    this.isDateModalOpen = true;
  }

  onDateSelected(event: any) {
    this.coupon.expireDate = event.detail.value;
    this.isDateModalOpen = false;
  }
  markDirty() {
  this.isDirty = true;
  }
  
  async saveCoupon() {

  if (!this.coupon.code || !this.coupon.amount) {
    alert('Code and Amount required');
    return;
  }

  const payload = {
    code: this.coupon.code,
    description: this.coupon.description,
    amount: this.coupon.amount,
    type: 'fixed_cart',

    individual_use: this.coupon.individualUse,
    usage_limit: this.coupon.usageLimit,
    usage_limit_per_user: this.coupon.usageLimitPerUser,
    exclude_sale_items: this.coupon.excludeSale,

    minimum_amount: this.coupon.minAmount,
    maximum_amount: this.coupon.maxAmount,

    expiry_date: this.coupon.expireDate
  };

  console.log("SENDING TO API:", payload);

  try {
    const response = await this.auth.createCoupon(payload);
    console.log("API RESPONSE:", response);

    if (response.success) {
      alert('Coupon Created Successfully');
      this.router.navigateByUrl('/secure/coupons');
    }

  } catch (error) {
    console.error("API ERROR:", error);
  }
}

}
