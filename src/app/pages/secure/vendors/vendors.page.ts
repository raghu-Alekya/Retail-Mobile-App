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
  vendors: any[] = [];
  loading = false;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadVendors();
  }

  async loadVendors(event?: any) {
    if (this.loading || !this.hasMore) return;

    this.loading = true;

    try {
      const res = await this.authService.getVendors(this.page, String(this.perPage));

      const data = res.data;

      // append vendors
      this.vendors = [...this.vendors, ...data.data];

      // pagination handling
      this.hasMore = data.pagination.has_more;
      this.page++;

    } catch (err) {
      console.error('Failed to load vendors', err);
      this.hasMore = false;
    }

    this.loading = false;
    if (event) event.target.complete();
  }

  async addVendor() {
    const modal = await this.modalCtrl.create({
      component: VendorFormComponent,
      componentProps: { mode: 'add' }
    });

    modal.onDidDismiss().then(res => {
      if (res.data) this.loadVendors();
    });

    await modal.present();
  }

  async editVendor(vendor: any) {
    const modal = await this.modalCtrl.create({
      component: VendorFormComponent,
      componentProps: {
        mode: 'edit',
        vendor
      }
    });

    modal.onDidDismiss().then(res => {
      if (res.data) this.loadVendors();
    });

    await modal.present();
  }

  async deleteVendor(vendor: any) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Vendor',
      message: `Delete <b>${vendor.title}</b>?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            // call delete API here
            this.vendors = this.vendors.filter(v => v.id !== vendor.id);
          }
        }
      ]
    });
    
    await alert.present();
    try {
      await this.authService.deleteVendor(vendor.id);
    } catch (err) {
      console.error('Failed to delete vendor', err);
    }
  }
}
