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

  @ViewChild('datePicker', { static: false }) datePicker!: IonDatetime;
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
  today: string = new Date().toISOString().split('T')[0];
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
  ) {}

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
  showCalendar = false;

toggleCalendar() {
  this.showCalendar = !this.showCalendar;
}

onDateSelected(event: any) {
  this.coupon.expireDate = event.detail.value;

  // close after selecting date
  this.showCalendar = false;
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

  
  async saveCoupon() {

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

if (!response?.success) {
  alert(response?.message || 'Coupon creation failed');
  return;
}

alert('Coupon Created Successfully');

  this.resetForm();

  this.navCtrl.navigateBack('/tabs/coupons');

} catch (error: any) {

  console.error(error);

  alert('Unable to create coupon');
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