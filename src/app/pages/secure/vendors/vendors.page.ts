import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { VendorFormComponent } from './vendor-form/vendor-form.component';
import { NavController } from '@ionic/angular';

@Component({
    selector: 'app-vendors',
    templateUrl: './vendors.page.html',
    styleUrls: ['./vendors.page.scss'],
    standalone: false
})
export class VendorsPage implements OnInit {

  page = 1;
  perPage = 10;
  hasMore = true;
  loading = false;

  vendors: any[] = [];
  filteredVendors: any[] = [];
  popupShown= false;
accentColors: string[] = [
    '#d1c876', // yellow
    '#de667c', // green
    '#6ac2c3', // red
    '#db8366', // teal
    '#66a8de'  // blue
  ];

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private navCtrl: NavController 
  ) {}
goBack() {
  this.navCtrl.navigateBack('/tabs/home');
}
  
  ngOnInit() {
    this.resetAndLoad();
  }

  /* ---------------- LOAD VENDORS ---------------- */

  async loadVendors(event?: any) {
    if (this.loading || !this.hasMore) return;

    this.loading = true;

    try {
      const res = await this.authService.getVendors(this.page, String(this.perPage));

      // 🔥 NORMALIZE DATA FOR UI (CRITICAL FIX)
      const mapped = res.data.map((v: any) => ({
        id: v.id,
        title: v.title,
        meta: v.meta,
        vendor_name: v.title,
        amount: v.amount || v.total_amount || v.totalAmount || 0,
        payment_method: v.payment_method || v.paymentMethod || '',
        type: (v.type || v.payoutType || 'purchase').toLowerCase(),
        note: v.note || v.remarks || 'Paid in full purchase'
      }));

      this.vendors = [...this.vendors, ...mapped];
      this.filteredVendors = [...this.vendors];

      this.hasMore = mapped.length === this.perPage;
      this.page++;

    } catch (err) {
      console.error('Failed to load vendors', err);
      this.hasMore = false;
    }

    this.loading = false;
    if (event) event.target.complete();
  }

  /* ---------------- SEARCH ---------------- */

  search(event: any) {
    const val = event.target.value?.toLowerCase() || '';

    this.filteredVendors = this.vendors.filter(v =>
      v.vendor_name.toLowerCase().includes(val)
    );
  }

  /* ---------------- AVATAR COLOR ---------------- */
  getAccentColor(index: number): string {
    return this.accentColors[index % this.accentColors.length];
  }

  /* ---------------- RESET ---------------- */

  resetAndLoad() {
    this.page = 1;
    this.hasMore = true;
    this.vendors = [];
    this.filteredVendors = [];
    this.loadVendors();
  }

  /* ---------------- ADD ---------------- */

  async addVendor() {
    this.checktoken();
    const modal = await this.modalCtrl.create({
      component: VendorFormComponent,
      componentProps: { mode: 'add' }
    });

    modal.onDidDismiss().then(res => {
      if (res.data) this.resetAndLoad();
    });

    await modal.present();
  }

  /* ---------------- EDIT ---------------- */

  async editVendor(vendor: any) {
    this.checktoken();
    const modal = await this.modalCtrl.create({
      component: VendorFormComponent,
      componentProps: {
        mode: 'edit',
        vendor
      }
    });

    modal.onDidDismiss().then(res => {
      if (res.data) this.resetAndLoad();
    });

    await modal.present();
  }

  /* ---------------- DELETE ---------------- */

  async deleteVendor(vendor: any) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Vendor',
      message: `Delete <b>${vendor.vendor_name}</b>?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
  try {
    await this.authService.deleteVendor(vendor.id);

    this.vendors = this.vendors.filter(v => v.id !== vendor.id);
    this.filteredVendors = [...this.vendors];

  } catch (error) {
    console.error('Delete failed', error);
  }
}
        }
      ]
    });

    await alert.present();
  }
  async checktoken() {
    
  const token = localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!).token : null;

    if (!token || token === 'undefined' || token === 'null') {

      await this.showLogoutPopup();

      return false;
    }

    try {

      const res: any = await this.authService.validateuser(token);
      if (
        res?.valid === 'false' ||
        res?.valid === false ||
        res?.valid === '0' ||
        res?.valid === 0
      ) {

        await this.showLogoutPopup();

        return false;
      }

      // TOKEN VALID
      if (res?.valid) {
        return true;
      }

      return true;

    } catch (error: any) {
  await this.showLogoutPopup();

  return false;
    }
  }
  async showLogoutPopup() {

    if (this.popupShown) {
      return;
    }

    this.popupShown = true;

    let countdown = 5;

    const alert = await this.alertCtrl.create({
      cssClass: 'custom-logout-alert',
      backdropDismiss: false,

      message: `
        <div class="logout-popup">

          <img src="../../assets/session-logout.png" class="logout-img" />

          <div class="logout-title">
            You've been logged out
          </div>

          <div class="logout-message">
            Your account was logged in from another device.
            For security reasons your session has ended.
          </div>

          <div class="logout-countdown">
            Redirecting in <span id="countdown">${countdown}</span>
          </div>

        </div>
      `
    });

    await alert.present();

    const interval = setInterval(async () => {

      countdown--;

      const countdownEl = document.getElementById('countdown');

      if (countdownEl) {
        countdownEl.innerText = countdown.toString();
      }

      if (countdown === 0) {

        clearInterval(interval);

        await alert.dismiss();

        localStorage.clear();
        sessionStorage.clear();

        this.popupShown = false;

        await this.navCtrl.navigateRoot('/signin');
      }

    }, 1000);
  }
}