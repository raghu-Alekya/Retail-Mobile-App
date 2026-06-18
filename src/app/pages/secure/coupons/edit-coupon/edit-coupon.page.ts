import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AlertController, NavController } from '@ionic/angular';

@Component({
    selector: 'app-edit-coupon',
    templateUrl: './edit-coupon.page.html',
    styleUrls: ['./edit-coupon.page.scss'],
    standalone: false
})
export class EditCouponPage implements OnInit {

  coupon: any = {};
  displayAmount = '0.00';
  rawDigits = '';
  displayMinAmount = '0.00';
  rawMinDigits = '';
  displayMaxAmount = '0.00';
  rawMaxDigits = '';
  couponCodeEmojiError = false;
  today = new Date().toISOString().split('T')[0];

  editField: any = {
    code: false,
    description: false,
    amount: false,
    usage_limit: false,
    usage_limit_per_user: false,
    minimum_amount: false,
    maximum_amount: false,
    date_expires: false
  };

  constructor(
    private router: Router,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  
isDateModalOpen = false;


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
}

openDatePicker() {
  this.isDateModalOpen = true;
}

setDate(event: any) {
  this.coupon.date_expires = event.detail.value;
  this.isDateModalOpen = false;
  
}
  async ngOnInit() {

    const stateCoupon = history.state.coupon;

    if (!stateCoupon?.id) {
      this.router.navigate(['/coupons']);
      return;
    }

    try {

      const res = await this.auth.getCouponById(stateCoupon.id);

      // ✅ handle API response correctly
      this.coupon = res.data ? res.data : res;
      this.displayAmount =
        Number(this.coupon.amount || 0).toFixed(2);

      this.rawDigits =
        Math.round(
          Number(this.coupon.amount || 0) * 100
        ).toString();

      this.displayMinAmount =
        Number(this.coupon.minimum_amount || 0).toFixed(2);

      this.rawMinDigits =
        Math.round(
          Number(this.coupon.minimum_amount || 0) * 100
        ).toString();

      this.displayMaxAmount =
        Number(this.coupon.maximum_amount || 0).toFixed(2);

      this.rawMaxDigits =
        Math.round(
          Number(this.coupon.maximum_amount || 0) * 100
        ).toString();
      

      console.log("Full coupon data:", this.coupon);

    } catch (error) {
      console.error("Failed to load coupon", error);
    }

  }
  onAmountInput(event: any) {

  const value =
    event?.detail?.value ||
    event?.target?.value ||
    '';

  this.rawDigits =
    value.replace(/[^\d]/g, '');

  const amount =
    Number(this.rawDigits || '0') / 100;

  this.displayAmount =
    amount.toFixed(2);

  this.coupon.amount = amount;

  event.target.value =
    this.displayAmount;
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

  this.coupon.minimum_amount =
    amount.toFixed(2);

  event.target.value =
    this.displayMinAmount;
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

  this.coupon.maximum_amount =
    amount.toFixed(2);

  event.target.value =
    this.displayMaxAmount;
}

  toggleEdit(field: string) {

  const isAlreadyOpen = this.editField[field];

  // close all
  Object.keys(this.editField).forEach(f => {
    this.editField[f] = false;
  });

  // if opening
  if (!isAlreadyOpen) {
    this.editField[field] = true;

    setTimeout(() => {
      const inputs = document.querySelectorAll('ion-input input');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      lastInput?.focus();
    }, 100);
  }
}
  

  // Update coupon API
async updateCoupon() {
  this.coupon.discount_type = 'fixed_cart';

  try {

    // Duplicate coupon validation
    const coupons = await this.auth.getCoupons();

    const duplicate = coupons.find((c: any) =>
      c.code?.toLowerCase().trim() ===
      this.coupon.code?.toLowerCase().trim() &&
      c.id !== this.coupon.id
    );

    if (duplicate) {

      alert('Coupon code already exists');

      return;
    }

    // Min / Max validation
    const min =
      Number(this.coupon.minimum_amount || 0);

    const max =
      Number(this.coupon.maximum_amount || 0);

    if (min > 0 && max > 0 && min > max) {

      alert(
        'Minimum amount should be less than maximum amount'
      );

      return;
    }

    // Update API
    const response = await this.auth.updateCoupon(
      this.coupon.id,
      this.coupon
    );

    alert('Coupon updated successfully');

    this.navCtrl.navigateBack('/tabs/coupons');

  } catch (error) {

    console.error('Update failed:', error);

    alert('Unable to update coupon');
  }
}

// Delete coupon
  async deleteCoupon() {
  console.log('Deleting ID:', this.coupon?.id);

  if (!this.coupon?.id) {
    console.error('Coupon ID missing');
    return;
  }

  const alert = await this.alertCtrl.create({
    header: 'Delete Coupon?',
    message: `Are you sure you want to delete <b>${this.coupon.code}</b>?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          try {
            await this.auth.deleteCoupon(this.coupon.id);
            this.navCtrl.navigateBack('/tabs/coupons');
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }
      }
    ]
  });

  await alert.present();
}



}