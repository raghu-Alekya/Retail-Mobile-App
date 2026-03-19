import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-edit-coupon',
  templateUrl: './edit-coupon.page.html',
  styleUrls: ['./edit-coupon.page.scss'],
})
export class EditCouponPage implements OnInit {

  coupon: any = {};

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
    private alertCtrl: AlertController
    
  ) {}

  
isDateModalOpen = false;

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

      

      console.log("Full coupon data:", this.coupon);

    } catch (error) {
      console.error("Failed to load coupon", error);
    }

  }

  toggleEdit(field: string) {

  const isAlreadyOpen = this.editField[field];

  // close all fields
  Object.keys(this.editField).forEach(f => {
    this.editField[f] = false;
  });

  if (!isAlreadyOpen) {

    this.editField[field] = true;

    // wait for input render
    setTimeout(() => {

      const inputs = document.querySelectorAll('ion-input input');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;

      lastInput?.focus();

    }, 300);

  }

}
  

  // Update coupon API
  async updateCoupon() {
    try {
      await this.auth.updateCoupon(this.coupon.id, this.coupon);
      this.router.navigate(['/coupons']);
    } catch (error) {
      console.error('Update failed:', error);
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
            this.router.navigate(['/coupons']);
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