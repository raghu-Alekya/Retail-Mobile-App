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

  coupon: any = {
    code: '',
    description: '',
    amount: null,
    type: 'cart',
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

  async saveCoupon() {

    if (!this.coupon.code || !this.coupon.amount) {
      return;
    }

    await this.auth.createCoupon(this.coupon);
    this.router.navigateByUrl('/secure/coupons');
  }

}
