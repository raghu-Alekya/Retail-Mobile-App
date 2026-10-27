import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-order-payments', templateUrl: './order-payments.page.html',
  styleUrls: ['./order-payments.page.scss'], standalone: false
})
export class OrderPaymentsPage implements OnInit, OnDestroy {
  payments: any[] = [];
  groupedPayments: any[] = [];
  page = 1;
  loading = false;
  hasMore = true;
  search = '';
  paymentMode = '';
  loadError = '';
  searchTimeout: ReturnType<typeof setTimeout>;
  private requestId = 0;
  private storeId = '';
  private recordsPromise: Promise<any[]> | null = null;

  constructor(private authService: AuthService) {}
  ngOnInit() { void this.loadPayments(undefined, true); }
  ionViewWillEnter() {
    if (!this.loading) { this.recordsPromise = null; void this.loadPayments(undefined, true); }
  }
  ngOnDestroy() { clearTimeout(this.searchTimeout); this.requestId++; }

  refresh(event: any) {
    this.recordsPromise = null;
    return this.loadPayments(event, true);
  }
  onPaymentFilter(event: any) {
    this.paymentMode = event.detail.value || '';
    void this.loadPayments(undefined, true);
  }
  onSearch(event: any) {
    const value = String(event.target.value || '').trim();
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.search = value;
      void this.loadPayments(undefined, true);
    }, 400);
  }

  private paymentMethod(payment: any): string {
    const value = String(payment.payment_method || payment.payment_method_title || '').toLowerCase().replace(/^pos[-_]/, '');
    if (value.startsWith('ebt')) return 'ebt';
    if (value === 'credit' || value === 'debit' || value.includes('card')) return 'card';
    return value;
  }

  groupPayments(list: any[] = this.payments): any[] {
    const grouped: Record<string, any> = {};
    list.forEach(payment => {
      const key = String(payment.order_id || payment.client_order_id || payment.id);
      if (!grouped[key]) grouped[key] = {
        order_id: key,
        order_number: payment.order_number || '—',
        order_total: payment.order_total,
        created_at: payment.payment_at,
        accepted_by: payment.accepted_by,
        currency: payment.currency || 'USD',
        transactions: []
      };
      const group = grouped[key];
      if (!group.transactions.some((item: any) => item.id === payment.id)) {
        group.transactions.push({
          id: payment.id,
          transaction_id: payment.local_id ?? '—',
          pay_mode: payment.payment_method_title || payment.payment_method || '—',
          tender_amount: payment.amount,
          currency: payment.currency || 'USD'
        });
      }
      if (Date.parse(payment.payment_at || '') > Date.parse(group.created_at || '')) group.created_at = payment.payment_at;
    });
    return Object.values(grouped).sort((a: any, b: any) => (Date.parse(b.created_at || '') || 0) - (Date.parse(a.created_at || '') || 0));
  }

  async loadPayments(event?: any, reset = false) {
    if (!reset && (this.loading || !this.hasMore)) { event?.target?.complete(); return; }
    const requestId = ++this.requestId;
    if (reset) { this.page = 1; this.payments = []; this.groupedPayments = []; this.hasMore = true; }
    this.loading = true;
    this.loadError = '';
    try {
      let storeId = '';
      try { storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || ''; } catch {}
      if (!this.recordsPromise || storeId !== this.storeId) {
        this.storeId = storeId;
        this.recordsPromise = this.authService.getPchPaymentRecords(storeId);
      }
      const records = await this.recordsPromise;
      if (requestId !== this.requestId) return;
      const search = this.search.toLowerCase().replace(/^#/, '');
      const filtered = records.filter(payment => {
        const isVoid = payment.is_void === true || payment.entry_type === 'void' || String(payment.status || '').toLowerCase() === 'void';
        if (this.paymentMode === 'void' ? !isVoid : this.paymentMode && this.paymentMethod(payment) !== this.paymentMode) return false;
        return !search || [payment.order_number, payment.client_order_id, payment.order_id].some(value => String(value || '').toLowerCase().includes(search));
      });
      const groups = this.groupPayments(filtered);
      this.payments = filtered;
      this.groupedPayments = groups.slice(0, this.page * 10);
      this.hasMore = this.page * 10 < groups.length;
      this.page++;
    } catch (error: any) {
      if (requestId === this.requestId) {
        this.recordsPromise = null;
        this.loadError = error?.message || 'Unable to load payments. Please try again.';
      }
    } finally {
      if (requestId === this.requestId) this.loading = false;
      event?.target?.complete();
    }
  }

  trackByOrder(index: number, item: any) { return item.order_id ?? index; }
  formatCurrencyString(value: any, currency = 'USD'): string {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: /^[A-Z]{3}$/.test(currency) ? currency : 'USD' }).format(Number.isFinite(amount) ? amount : 0);
  }
}
