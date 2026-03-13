import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LoadingController } from '@ionic/angular';
@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
})
export class CustomersPage {

  customers: any[] = [];
  page = "1";
  perPage = "20";
  searchTerm = '';
  hasMore = true;
  loading = false;

  private searchTimeout: any; // ✅ debounce

  constructor(private authService: AuthService, 
    private loadingCtrl: LoadingController) {}

  // ✅ Better for Ionic pages
  async ionViewDidEnter() {

  const loading = await this.loadingCtrl.create({
    message: '',
    spinner: 'crescent'
  });

  await loading.present();

  try {
    await this.loadCustomers(true);
  } catch (error) {
    console.error(error);
  }

  await loading.dismiss();
}

  async loadCustomers(reset = false) {
    if (this.loading) return;

    this.loading = true;

    try {
      if (reset) {
        this.page = "1";
        this.customers = [];
        this.hasMore = true;
      }

      const currentPage = Number(this.page) || 1;
      const perPageNum = Number(this.perPage) || 20;

      const response = await this.authService.getCustomers(
        String(currentPage),
        String(perPageNum),
        this.searchTerm
      );

      if (Array.isArray(response) && response.length > 0) {
        this.customers = [...this.customers, ...response];

        // ⚠️ Important: This condition is NOT reliable due to filtering
        if (response.length < perPageNum) {
          this.hasMore = false;
        }

        this.page = String(currentPage + 1);
      } else {
        this.hasMore = false;
      }

    } catch (error) {
      console.error('Pagination error:', error);
      this.hasMore = false; // ✅ prevent infinite loading
    } finally {
      this.loading = false;
    }
  }

  // ✅ Debounced search (important)
  onSearch(event: any) {
    const value = event?.target?.value?.trim() || '';

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.searchTerm = value;
      this.loadCustomers(true);
    }, 400);
  }

  loadMore(event: any) {
    if (!this.hasMore) {
      event?.target?.complete();
      return;
    }

    this.loadCustomers().then(() => {
      event?.target?.complete();

      if (!this.hasMore && event?.target) {
        event.target.disabled = true;
      }
    });
  }
}