import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-order-payments',
  templateUrl: './order-payments.page.html',
  styleUrls: ['./order-payments.page.scss'],
})
export class OrderPaymentsPage implements OnInit {
  payments: any[] = [];
  page = 1;
  loading = false;
  hasMore = true;
  search = '';
  status = '';
  searchTimeout: any;
  constructor(
    private toastCtrl: ToastController,     
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.loadPayments();
  }

  
  /**
   * Pull to refresh
   */
  refresh(event: any) {
    this.loadPayments(event);
  }

    /**
   * Status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'medium';
      default:
        return 'warning';
    }
  }

  async loadPayments(event?: any, reset = false) {

    // prevent duplicate calls
    if (this.loading) {
      event?.target.complete();
      return;
    }

    if (reset) {
      this.page = 1;
      this.payments = [];
      this.hasMore = true;
    }

    if (!this.hasMore) {
      event?.target.complete();
      return;
    }

    this.loading = true;

    try {
      const res = await this.authService.getOrderPayments(
        this.page,
        this.search,
        this.status
      );

      console.log('Order payments API:', res);

      // ✅ CORRECT DATA EXTRACTION
      const items = Array.isArray(res?.data) ? res.data : [];

      if (items.length > 0) {
        this.payments.push(...items);
        this.page++;
        this.hasMore = res.pagination?.has_more ?? false;
      } else {
        this.hasMore = false;
      }

    } catch (err) {
      console.error('Payment load failed', err);
    }

    this.loading = false;
    event?.target.complete();
  }



  onSearch(event: any) {
    const value = event.target.value?.trim() || '';
    this.search = value;
    this.loadPayments(undefined, true);
  }

  /**
   * Format date safely
   */
  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  }

  
}
