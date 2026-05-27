import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { IonDatetime } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { pencil } from 'ionicons/icons';
import { NavController } from '@ionic/angular';

addIcons({ pencil });

@Component({
  selector: 'app-add-coupon',
  templateUrl: './add-coupon.page.html',
  styleUrls: ['./add-coupon.page.scss'],
})
export class AddCouponPage {

  @ViewChild('datePicker', { static: false }) datePicker!: IonDatetime;
showDatePicker = false;
fromFab = false;
  editing: string | null = null;

  isDateModalOpen = false;
  isDirty = false;
  coupon: any = {
  code: '',
  description: '',
  amount: null,
  type: null,
  individualUse: false,
  usageLimit: null,
  usageLimitPerUser: null,
  excludeSale: false,
  minAmount: null,
  maxAmount: null,
  expireDate: ''
};

  constructor(
    private navCtrl: NavController,
    private auth: AuthService,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();

this.fromFab = nav?.extras?.state?.['fromFab'] || false;
  }

  startEdit(field: string) {
  this.editing = field;

  setTimeout(() => {
    const inputs = document.querySelectorAll('ion-input input');
    const activeInput = inputs[inputs.length - 1] as HTMLInputElement;
    activeInput?.focus();
  }, 100);
}
  showCalendar = false;

toggleCalendar() {
  this.showCalendar = !this.showCalendar;
}
openDatePicker() {
  this.showDatePicker = true;
}

setDate(event: any) {
  this.coupon.expireDate = event.detail.value.split('T')[0];
  this.showDatePicker = false; // close popup immediately
}
onDateSelected(event: any) {
  this.coupon.expireDate = event.detail.value;

  // close after selecting date
  this.showCalendar = false;
}
  stopEdit() {
    this.editing = null;
  }

  goBack() {

  if (this.fromFab) {

    this.router.navigate(
      ['/tabs/home'],
      { replaceUrl: true }
    );

  } else {

    this.navCtrl.navigateBack('/tabs/coupons');

  }

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

    // ✅ FIX HERE
    type: this.coupon.type,

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

    if (response.success) {
      this.coupon.code = response.original_code;
      alert('Coupon Created Successfully');
      this.resetForm();
      if (this.fromFab) {

  this.router.navigate(
    ['/tabs/home'],
    { replaceUrl: true }
  );

} else {

  this.navCtrl.navigateBack('/tabs/coupons');

}
    }

  } catch (error) {
    console.error("API ERROR:", error);
  }
}
resetForm() {
  this.coupon = {
    code: '',
    description: '',
    amount: null,
    type: null,
    individualUse: false,
    usageLimit: null,
    usageLimitPerUser: null,
    excludeSale: false,
    minAmount: null,
    maxAmount: null,
    expireDate: ''
  };

  this.editing = null;
  this.isDirty = false;
}
markDirty() {
  this.isDirty = true;
}
ionViewWillEnter() {
  this.resetForm();
}
}