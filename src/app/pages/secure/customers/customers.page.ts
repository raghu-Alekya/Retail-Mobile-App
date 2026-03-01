import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

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

  constructor(private authService: AuthService) {}

  // ✅ Better for Ionic pages
  ionViewDidEnter() {
    this.loadCustomers(true);
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

      const response = await this.authService.getCustomers(
        this.page,
        this.perPage,
        this.searchTerm
      );

      if (Array.isArray(response) && response.length > 0) {
        this.customers = [...this.customers, ...response];

        // ✅ stop if no more data
        if (response.length < parseInt(this.perPage, 10)) {
          this.hasMore = false;
        }

        this.page = String(parseInt(this.page, 10) + 1);
      } else {
        this.hasMore = false;
      }

    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      this.loading = false;
    }
  }

  // ✅ Debounced search (important)
  onSearch(event: any) {
    const value = event.target.value?.trim() || '';

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.searchTerm = value;
      this.loadCustomers(true); // reset
    }, 400); // 400ms debounce
  }

  loadMore(event: any) {
    this.loadCustomers().then(() => {
      event.target.complete();

      if (!this.hasMore) {
        event.target.disabled = true;
      }
    });
  }
}