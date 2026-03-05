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
  groupedPayments: any[] = [];
  page = 1;
  loading = false;
  hasMore = true;
  search = '';
  // status = '';
  searchTimeout: any;
  paymentMode = '';
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
  onPaymentFilter(event: any) {

    const mode = event.detail.value || '';

    this.paymentMode = mode;

    // reset pagination
    this.page = 1;
    this.payments = [];
    this.groupedPayments = [];
    this.hasMore = true;

    this.loadPayments();
  }
  // groupPayments(list: any[] = this.payments) {

  //   const grouped: any = {};

  //   list.forEach((p: any) => {

  //     const orderId = p?.meta?.order_id;

  //     if (!grouped[orderId]) {
  //       grouped[orderId] = {
  //         order_id: orderId,
  //         order_total: p.order_total,
  //         created_at: p.created_at,
  //         accepted_by: p.accepted_by,
  //         payment_method: p.payment_method,
  //         transactions: []
  //       };
  //     }

  //     grouped[orderId].transactions.push({
  //       transaction_id: p.transaction_id,
  //       pay_mode: p.pay_mode,
  //       tender_amount: p.tender_amount
  //     });

  //   });

  //   this.groupedPayments = [...Object.values(grouped)];
  // }
  groupPayments(list: any[] = this.payments) {

    const grouped: any = {};

    list.forEach((p: any) => {

      const orderId = p?.meta?.order_id;

      if (!grouped[orderId]) {
        grouped[orderId] = {
          order_id: orderId,
          order_total: p.order_total,
          created_at: p.created_at,
          accepted_by: p.accepted_by,
          payment_method: p.payment_method,
          transactions: []
        };
      }

      grouped[orderId].transactions.push({
        transaction_id: p.transaction_id,
        pay_mode: p.pay_mode,
        tender_amount: p.tender_amount
      });

    });

    const newGroups = Object.values(grouped);

    // 🔥 merge instead of reset
    if (this.page === 1) {
      this.groupedPayments = newGroups;
    } else {
      this.groupedPayments = [...this.groupedPayments, ...newGroups];
    }
  }
  trackByOrder(index: number, item: any) {
    return item.order_id;
  }
    /**
   * Status badge color
   */
  // getStatusColor(status: string): string {
  //   switch (status) {
  //     case 'open':
  //       return 'success';
  //     case 'closed':
  //       return 'medium';
  //     default:
  //       return 'warning';
  //   }
  // }

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
        // this.status,
        this.paymentMode
      );

      console.log('Order payments API:', res);

      // ✅ CORRECT DATA EXTRACTION
      const items = Array.isArray(res?.data) ? res.data : [];

      if (items.length > 0) {
        if (this.page === 1) {
          this.payments = items;
        } else {
          this.payments.push(...items);
        }

        this.groupPayments(items); // group only new items

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

  // onSearch(event: any) {
  //   const value = event.target.value?.trim() || '';
  //   this.search = value;
  //   this.loadPayments(undefined, true);
  // }
  // onSearch(event: any) {

  //   const value = event.target.value?.toLowerCase().trim() || '';

  //   this.search = value;

  //   if (!value) {
  //     this.groupPayments();
  //     return;
  //   }

  //   const filtered = this.payments.filter((p: any) => {

  //     const orderId = String(p?.meta?.order_id || '').toLowerCase();
  //     const transactionId = String(p?.transaction_id || '').toLowerCase();
  //     const paymentMethod = String(p?.payment_method || '').toLowerCase();

  //     return (
  //       orderId.includes(value) ||
  //       transactionId.includes(value) ||
  //       paymentMethod.includes(value)
  //     );
  //   });

  //   this.groupPayments(filtered);
  // }
  // onSearch(event: any) {

  //   clearTimeout(this.searchTimeout);

  //   this.searchTimeout = setTimeout(() => {

  //     const value = event.target.value?.trim() || '';

  //     this.search = value;

  //     // reset pagination
  //     this.page = 1;
  //     this.payments = [];
  //     this.groupedPayments = [];
  //     this.hasMore = true;

  //     this.loadPayments();

  //   }, 2000);

  // }
  onSearch(event: any) {

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {

      const value = event.target.value?.trim() || '';

      this.search = value;

      this.page = 1;
      this.hasMore = true;

      this.payments = [];
      this.groupedPayments = [];

      this.loadPayments();

    }, 500); // faster debounce
  }
  /**
   * Format date safely
   */
  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  }

  
}
