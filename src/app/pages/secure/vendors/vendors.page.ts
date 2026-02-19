import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { VendorFormComponent } from './vendor-form/vendor-form.component';

@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.page.html',
  styleUrls: ['./vendors.page.scss']
})
export class VendorsPage implements OnInit {

  page = 1;
  perPage = 10;
  hasMore = true;
  loading = false;

  vendors: any[] = [];
  filteredVendors: any[] = [];

accentColors: string[] = [
    '#2bb0a8', // teal
    '#8b8ee8', // blue
    '#f3b431', // yellow
    '#cc77da', // purple
    '#f28b54'  // orange
  ];

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private authService: AuthService
  ) {}

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
        vendor_name: v.vendor_name || v.vendorName || v.title || '',
        amount: v.amount || v.total_amount || v.totalAmount || 0,
        payment_method: v.payment_method || v.paymentMethod || '',
        type: v.type || v.payoutType || 'Purchase',
        note: v.note || v.remarks || 'Paid in full purchase'
      }));

      this.vendors = [...this.vendors, ...mapped];
      this.filteredVendors = [...this.vendors];

      this.hasMore = res.data.pagination?.has_more ?? false;
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
          handler: () => {
            // 🔥 ideally call delete API here
            this.vendors = this.vendors.filter(v => v.id !== vendor.id);
            this.filteredVendors = [...this.vendors];
          }
        }
      ]
    });

    await alert.present();
  }
}
