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
    standalone: false
})
export class AddCouponPage {

  

fromFab = false;
  editing: string | null = null;

  isDateModalOpen = false;
  isDirty = false;
  // NEW VARIABLES
  displayAmount = '0.00';
  rawDigits = '';
  displayMinAmount = '0.00';
  rawMinDigits = '';
  displayMaxAmount = '0.00';
  rawMaxDigits = '';
  couponCodeEmojiError = false;
  today: string = '';
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
    private navCtrl: NavController,
    private auth: AuthService,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();

this.fromFab = nav?.extras?.state?.['fromFab'] || false;
console.log('FROM FAB:', this.fromFab);
console.log('STATE:', history.state);
  }

  ngOnInit() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  this.today = `${yyyy}-${mm}-${dd}`;
}

  containsEmoji(value: string): boolean {

  if (!value) {
    return false;
  }

  const emojiRegex =
    /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

  return emojiRegex.test(value);
}

onCouponCodeChange(value: string) {

  if (this.containsEmoji(value)) {

    this.coupon.code = value.replace(
      /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
      ''
    );

    this.couponCodeEmojiError = true;
    return;
  }

  this.couponCodeEmojiError = false;
  this.coupon.code = value;

  this.markDirty();
}

  startEdit(field: string) {

  this.editing = field;

  if (field === 'amount') {
    this.rawDigits = '';
    this.displayAmount = '0.00';
  }

  setTimeout(() => {
    const inputs = document.querySelectorAll('ion-input input');
    const activeInput = inputs[inputs.length - 1] as HTMLInputElement;
    activeInput?.focus();
  }, 100);
}
  showDatePicker = false;

setDate(event: any) {
  this.coupon.expireDate =
    event.detail.value.split('T')[0];

  this.showDatePicker = false;
}

  stopEdit() {
    this.editing = null;
  }

  onAmountInput(event: any) {

  const value =
    event?.detail?.value ||
    event?.target?.value ||
    '';

  this.rawDigits = value.replace(/[^\d]/g, '');

  const amount =
    Number(this.rawDigits || '0') / 100;

  this.displayAmount =
    amount.toFixed(2);

  this.coupon.amount = amount;

  event.target.value = this.displayAmount;
}
  onMinAmountInput(event: any) {

  const value =
    event?.detail?.value ||
    event?.target?.value ||
    '';

  this.rawMinDigits =
    value.replace(/[^\d]/g, '');

  const amount =
    Number(this.rawMinDigits || '0') / 100;

  this.displayMinAmount =
    amount.toFixed(2);

  this.coupon.minAmount =
    amount.toFixed(2);

  event.target.value =
    this.displayMinAmount;

  this.markDirty();
}

  onMaxAmountInput(event: any) {

  const value =
    event?.detail?.value ||
    event?.target?.value ||
    '';

  this.rawMaxDigits =
    value.replace(/[^\d]/g, '');

  const amount =
    Number(this.rawMaxDigits || '0') / 100;

  this.displayMaxAmount =
    amount.toFixed(2);

  this.coupon.maxAmount =
    amount.toFixed(2);

  event.target.value =
    this.displayMaxAmount;

  this.markDirty();
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

validateExpiryDate() {

  if (!this.coupon.expireDate) {
    return;
  }

  const selectedDate = new Date(
    this.coupon.expireDate + 'T00:00:00'
  );

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {

    alert('Past dates are not allowed');

    this.coupon.expireDate = '';
  }
}
  
  async saveCoupon() {

    if (this.coupon.expireDate) {

    const selectedDate = new Date(
      this.coupon.expireDate + 'T00:00:00'
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {

      alert('Expiry date cannot be in the past');

      return;
    }
  }

  if (!this.coupon.code || !this.coupon.amount) {
    alert('Code and Amount required');
    return;
  }

  const min =
  Number(this.coupon.minAmount || 0);

const max =
  Number(this.coupon.maxAmount || 0);

if (min > 0 && max > 0 && min > max) {

  alert(
    'Minimum amount should be less than maximum amount'
  );

  return;
}

  const payload = {
    code: this.coupon.code,
    description: this.coupon.description,
    amount: this.coupon.amount,

    // ✅ FIX HERE
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

    console.log('RESPONSE:', response);

  if (response?.code === 'duplicate_coupon') {

    alert('Coupon code already exists');
    return;
  }

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

  } catch (error) {
    console.error("API ERROR:", error);
  }
}
resetForm() {
  this.couponCodeEmojiError = false;
  this.coupon = {
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