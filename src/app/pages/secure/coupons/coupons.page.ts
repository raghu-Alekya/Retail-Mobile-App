import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-coupons',
    standalone: true,
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
  loadError = '';
  private couponRequestId = 0;
  private loadingContext = '';
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
    void this.loadCoupons();
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
  let merchantId = '';
  let storeId = '';
  try {
    merchantId = JSON.parse(localStorage.getItem('merchant_data') || 'null')?.id || '';
    storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || '';
  } catch {}
  const context = merchantId + ':' + storeId;
  if (this.loading && this.loadingContext === context) return;
  const requestId = ++this.couponRequestId;
  this.loadingContext = context;
  this.loading = true;
  this.loadError = '';
  this.coupons = [];
  this.filteredCoupons = [];
  try {
    const coupons = await this.auth.getPchCoupons(merchantId, storeId);
    if (requestId !== this.couponRequestId) return;
    this.coupons = coupons;
    this.filterCoupons();
  } catch (error: any) {
    if (requestId === this.couponRequestId) this.loadError = error?.message || 'Unable to load coupons. Please try again.';
  } finally {
    if (requestId === this.couponRequestId) this.loading = false;
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