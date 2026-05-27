import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';


@Component({
  standalone: true,
  selector: 'app-coupons',
  templateUrl: './coupons.page.html',
  styleUrls: ['./coupons.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CouponsPage implements OnInit, OnDestroy {
  private routerSub!: Subscription;
searchTerm: string = '';
coupons: any[] = [];
filteredCoupons: any[] = [];
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
  private alertCtrl: AlertController,
  private router: Router,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Trigger reload when navigating back to coupons page
      if (event.urlAfterRedirects && event.urlAfterRedirects.includes('coupons')) {
        this.loadCoupons();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }
  editCoupon(coupon: any) {
  this.router.navigate(['/edit-coupon'], {
    state: { coupon }
  });
}
openAddCoupon() {
  this.router.navigate(['/add-coupon']);
}
ionViewDidEnter() {
  this.loadCoupons();
}
async loadCoupons() {
  this.loading = true;

  try {
    const response = await this.auth.getCoupons();

    // 🔥 FIXED
    const data = response?.data ? response.data : response;

    this.coupons = data || [];
    this.filteredCoupons = [...this.coupons];

    console.log("Updated coupons:", this.coupons);
    this.cdr.detectChanges();

  } catch (error) {
    console.error('Error loading coupons:', error);
    this.coupons = [];
    this.filteredCoupons = [];
  } finally {
    this.loading = false;
  }
}
ionViewWillEnter() {
  const state = history.state;

  if (state?.autoOpenCreate) {
    this.openCreate();
    history.replaceState({}, '');
  }

  console.log("Refreshing coupons..."); // 🔥 debug
  this.loadCoupons();
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
 filterCoupons() {
  const term = this.searchTerm.toLowerCase().trim();

  if (!term) {
    this.filteredCoupons = [...this.coupons];
    return;
  }

  this.filteredCoupons = this.coupons.filter(coupon =>
    coupon.code?.toLowerCase().includes(term) ||
    coupon.description?.toLowerCase().includes(term)
  );

}
}