import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AssetsService } from 'src/app/services/assets/assets.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-order-list',
    standalone: true,
    templateUrl: './orders-list.page.html',
    styleUrls: ['./orders-list.page.scss'],
    imports: [IonicModule, CommonModule, RouterModule, FormsModule]
})
export class OrderListPage implements OnInit {

  readonly fallbackProductImage = 'assets/img/Custom image.png';

  getOrderItemImage(item: any): string {
    const candidates = [item?.image, ...(Array.isArray(item?.images) ? item.images : []),
      item?.product_data?.image, ...(Array.isArray(item?.product_data?.images) ? item.product_data.images : [])];
    for (const image of candidates) {
      const src = typeof image === 'string' ? image : image?.src;
      if (typeof src === 'string' && src.trim()) return src.trim();
    }
    return this.fallbackProductImage;
  }

  onOrderImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    if (image.getAttribute('src') !== this.fallbackProductImage) image.src = this.fallbackProductImage;
  }

  orders: any[] = [];
  storeId = '';
  totalOrders = 0;
  loadError = '';
  private requestId = 0;
  private countRequestId = 0;
  private entryLoad: Promise<void> | null = null;
  page = 1;
  loading = false;
  hasMore = true;
  activeFilter: string = 'all';
  selectedStatus = 'all';
  currencySymbol: string = '';

  searchTerm: string = '';
  searchTimeout: any;

  showDateModal = false;
  fromDateApi = '';
toDateApi = '';
selectedDateText = '';
fromDateValue = '';
toDateValue = '';
dateFilterTab: 'date' | 'range' = 'date';
calendarMode: 'single' | 'from' | 'to' | null = null;
filterType: 'date' | 'range' | '' = '';
maxDate = this.localDateKey(new Date());
dateError = '';

private localDateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

onDateSelected(field: 'from' | 'to', value: string | string[] | null | undefined) {
  const selected = Array.isArray(value) ? value[0] : value;
  if (!selected) return;
  if (field === 'from') this.fromDateValue = selected.slice(0, 10);
  else this.toDateValue = selected.slice(0, 10);
  this.dateError = '';
  this.calendarMode = null;
}


  expandedOrderId: number | null = null;

  constructor(
    private authService: AuthService,
    private assetsService: AssetsService
  ) { }

  ngOnInit() {
    void this.ionViewWillEnter();
    this.assetsService.assets$.subscribe(assets => {
      if (assets?.currency_symbol) this.currencySymbol = assets.currency_symbol;
    });
  }

  async ionViewWillEnter() {
    let storeId = '';
    try { storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || ''; } catch {}
    if (storeId === this.storeId && this.entryLoad) return this.entryLoad;
    if (storeId === this.storeId && this.orders.length) return;
    this.storeId = storeId;
    this.page = 1;
    this.orders = [];
    this.hasMore = true;
    const pending = Promise.all([this.loadStatusCounts(), this.loadOrders()]).then(() => {});
    this.entryLoad = pending;
    try { await pending; } finally { if (this.entryLoad === pending) this.entryLoad = null; }
  }

  async loadStatusCounts() {
    const requestId = ++this.countRequestId;
    const storeId = this.storeId;
    this.totalOrders = 0;
    this.statuses.forEach(status => status.count = 0);
    if (!storeId) return;
    try {
      const [counts, all] = await Promise.all([
        this.authService.getPchOrderStatusCounts(storeId),
        this.authService.getPchOrdersPage(1, storeId, '', 1)
      ]);
      if (requestId !== this.countRequestId || storeId !== this.storeId) return;
      this.totalOrders = all.total;
      this.statuses.forEach(status => status.count = counts[status.value.replace(/-/g, '_')] ?? 0);
    } catch { /* The list still shows its own loading error if the request fails. */ }
  }
  /* ================================
     LOAD ORDERS
  ================================= */
  setFilter(status: string) {
  this.activeFilter = status;
  this.selectedStatus = status;

  this.page = 1;
  this.orders = [];

  this.hasMore = true;

  this.loadOrders();
}

statuses = [
  { key: 'wc-completed', value: 'completed', count: 0 },
  { key: 'wc-pending', value: 'pending', count: 0 },
  { key: 'wc-cancelled', value: 'cancelled', count: 0 },
  { key: 'wc-refunded', value: 'refunded', count: 0 },
  { key: 'partial-refund', value: 'partial-refund', count: 0 },
  { key: 'wc-on-hold', value: 'on-hold', count: 0 },
  { key: 'wc-processing', value: 'processing', count: 0 }
];

  getStatusCount(value: string): number {

  if (value === 'all') return this.totalOrders;

  const status = this.statuses.find(
    s => s.value === value
  );

  return status?.count || 0;
}

  async loadOrders(event?: any) {
    if (event && (this.loading || !this.hasMore)) { event.target?.complete(); return; }
    const requestId = ++this.requestId;
    const storeId = this.storeId;
    const search = this.searchTerm.replace('#', '').trim().toLowerCase();
    const status = this.selectedStatus;
    const from = this.fromDateApi;
    const to = this.toDateApi;
    let page = this.page;
    const matches: any[] = [];
    this.loading = true;
    this.loadError = '';
    try {
      if (!storeId) throw new Error('Select a store on the dashboard first.');
      if (from || to) {
        const allOrders = await this.authService.getPchDailyOrders(storeId);
        if (requestId !== this.requestId) return;
        const datedOrders = allOrders.filter(order => {
          const day = String(order.date_created || '').slice(0, 10);
          return !!day && (!from || day >= from) && (!to || day <= to);
        });
        this.totalOrders = datedOrders.length;
        this.statuses.forEach(bucket => {
          bucket.count = datedOrders.filter(order => this.normalizedOrderStatus(order.status) === bucket.value).length;
        });
        const filtered = datedOrders.filter(order => {
          if (status !== 'all' && this.normalizedOrderStatus(order.status) !== status) return false;
          return !search || String(order.id).includes(search) || String(order.woo_order_id || '').includes(search);
        });
        const rows = filtered.slice((page - 1) * 10, page * 10).map(order => ({
          ...order,
          date_created: String(order.date_created || '').replace(' ', 'T'),
          status: this.normalizedOrderStatus(order.status)
        }));
        this.orders = page === 1 ? rows : [...this.orders, ...rows];
        this.page = page + 1;
        this.hasMore = page * 10 < filtered.length;
        const currency = rows.find(order => order.currency_symbol)?.currency_symbol;
        if (currency) this.currencySymbol = currency;
        return;
      }
      let hasMore = true;
      do {
        const data = await this.authService.getPchOrdersPage(page, storeId, status);
        if (requestId !== this.requestId) return;
        if (status === 'all' && !search && !from && !to) this.totalOrders = data.total;
        data.orders.forEach(order => {
          const day = String(order.date_created || '').slice(0, 10);
          if (search && !String(order.id).toLowerCase().includes(search) && !String(order.woo_order_id || '').toLowerCase().includes(search)) return;
          if ((from && day < from) || (to && day > to)) return;
          matches.push(order);
        });
        const responseCurrency = data.orders.find(order => order.currency_symbol)?.currency_symbol;
        if (responseCurrency) this.currencySymbol = responseCurrency;
        hasMore = data.orders.length > 0 && page * 10 < data.total;
        page++;
      } while ((search || from || to) && matches.length < 10 && hasMore);
      this.orders = this.page === 1 ? matches : [...this.orders, ...matches];
      this.page = page;
      this.hasMore = hasMore;
    } catch (error: any) {
      if (requestId === this.requestId) this.loadError = error?.message || 'Unable to load orders. Please try again.';
    } finally {
      if (requestId === this.requestId) this.loading = false;
      event?.target?.complete();
    }
  }

  /* ================================
     SEARCH (Debounced)
  ================================= */
  onSearch(event: any) {
    const value = event.target.value?.trim();

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.searchTerm = value || '';

      this.page = 1;
      this.orders = [];
      this.hasMore = true;
      this.loading = false; // release lock to prevent deadlock

      this.loadOrders();
    }, 400);
  }

  /* ================================
     EXPAND ORDER
  ================================= */
  toggleExpand(orderId: number) {

  const order = this.orders.find(o => o.id === orderId);

  console.log(
    order?.line_items?.map((i: any) => ({
      name: i.name,
      slug: i.product_data?.slug,
      subtotal: i.subtotal,
      total: i.total
    }))
  );

  this.expandedOrderId =
    this.expandedOrderId === orderId ? null : orderId;
}
  isExpanded(orderId: number): boolean {
    return this.expandedOrderId === orderId;
  }

  /* ================================
     HELPERS
  ================================= */

  getStatusColor(status: string): string {
    switch (status) {
      case 'processing': return 'primary';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled':
      case 'failed': return 'danger';
      default: return 'medium';
    }
  }

  private normalizedOrderStatus(status: string): string {
    const key = String(status || '').toLowerCase().replace(/^wc-/, '').replace(/[ _]+/g, '-');
    return key === 'processing' ? 'pending' : key === 'partially-refunded' ? 'partial-refund' : key;
  }

  getDisplayStatus(status: string): string {
    return status?.toLowerCase() === 'processing' ? 'pending' : status;
  }

  getStatusClass(status: string): string {
  switch (this.getDisplayStatus(status)?.toLowerCase()) {
    case 'completed':
      return 'completed-status';

    case 'pending':
      return 'pending-status';

    case 'cancelled':
      return 'cancelled-status';

    case 'partially-refunded':
    case 'partial-refund':
      return 'partial-refund-status';

    case 'refunded':
      return 'refunded-status';

    default:
      return 'completed-status';
  }
}

  timeAgo(date: string): string {
    const diff = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  trackById(_: number, order: any) {
    return order.id;
  }

  /* ================================
     STATUS FILTER (READY)
  ================================= */


  orderStatuses = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Pending', value: 'pending' },
    { label: 'On Hold', value: 'on-hold' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Partially Refunded', value: 'partial-refund' }
  ];

  showMoreStatuses = false;
  // selectStatus(status: string) {
  //   if (this.loading) return;
  //   this.selectedStatus = status;
  //   this.activeFilter = status;
  //   this.setFilter(status);
  //   // reload when filter changes
  //   this.page = 1;
  //   this.orders = [];
  //   this.hasMore = true;

  //   this.loadOrders();
  // }

  formatAmount(value: any): string {
    const num = Number(value || 0);

    return num < 0
      ? `-${this.currencySymbol}${Math.abs(num)}`
      : `${this.currencySymbol}${num}`;
  }

  getProductDiscount(order: any): number {
    let total = 0;

    order.line_items?.forEach((item: any) => {
      item.meta_data?.forEach((meta: any) => {

        // ✅ NEW CORRECT KEY
        if (meta.key === '_pos_auto_discount') {
          total += Number(meta.value || 0);
        }

        // OPTIONAL (future safe)
        if (
          meta.key === '_pinaka_multipack_product_discount' ||
          meta.key === 'Discount Applied'
        ) {
          total += Number(meta.value || 0);
        }

      });
    });

    return total;
  }
  getDiscount(item: any): any | null {
    if (!item?.meta_data) return null;

    const typeMeta = item.meta_data.find(
      (m: any) => m.key === '_pos_discount_type'
    );

    if (!typeMeta) return null;

    const type = typeMeta.value;

    const amountMeta = item.meta_data.find(
      (m: any) => m.key === '_pos_auto_discount'
    );

    const amount = Number(amountMeta?.value || 0);

    if (!amount) return null;

    let label = 'Discount';
    switch (type) {
      case 'auto':
        label = 'Auto Discount';
        break;

      case 'multipack':
        label = 'Multipack Discount';
        break;

      case 'mixmatch':
        label = 'Combo Discount';
        break;
    }

    return { type, label, amount };
  }
  getRefundedQty(item: any): number {
    const meta = item.meta_data?.find(
      (m: any) => m.key === '_pos_refunded_items'
    );

    return Number(meta?.value || 0);
  }
  getRefundType(item: any): 'none' | 'partial' | 'full' {
    const refunded = this.getRefundedQty(item);
    const qty = Number(item.quantity || 0);

    if (refunded === 0) return 'none';
    if (refunded < qty) return 'partial';
    return 'full';
  }
  getOrderTotal(order: any): number {
    const meta = order.meta_data?.find(
      (m: any) => m.key === '_pos_partial_order_total'
    );

    return Number(meta?.value || order.total || 0);
  }
  getOrderTax(order: any): number {
    const meta = order.meta_data?.find(
      (m: any) => m.key === '_pos_partial_tax_total'
    );

    const value = Number(meta?.value || order.total_tax || 0);

    return Number(value.toFixed(2));
  }

  private matchingOrderFees(order: any, name: string): any[] {
    return (order.fee_lines || []).filter((fee: any) =>
      String(fee.name || '').trim().toLowerCase().replace(/[ _-]+/g, '_') === name);
  }

  getDiscountLineItem(order: any): number {
    const fees = this.matchingOrderFees(order, 'merchant_discount');
    if (fees.length) return fees.reduce((sum: number, fee: any) => sum + Math.abs(Number(fee.total) || 0), 0);
    return (order.coupon_lines || [])
      .filter((coupon: any) => coupon.code?.startsWith('merchant_discount_'))
      .reduce((sum: number, coupon: any) => sum + Math.abs(Number(coupon.discount) || 0), 0);
  }

getTotalItemCount(order: any): number {
  return (order.line_items || [])
    .filter((item: any) => item.product_data?.slug !== 'discount')
    .reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
}

getCouponTotal(order: any): number {
  return (order.coupon_lines || [])
    .filter((coupon: any) => !coupon.code?.startsWith('merchant_discount_'))
    .reduce((sum: number, coupon: any) => sum + Number(coupon.discount || 0), 0);
}

getServiceCharge(order: any): number {
  return Number(order.shipping_total || 0);
}

getCashbackFee(order: any): number {
  return this.matchingOrderFees(order, 'cashback_fee')
    .reduce((sum: number, fee: any) => sum + (Number(fee.total) || 0), 0);
}

getGrossTotal(order: any): number {
  return (order.line_items || [])
    .filter((item: any) =>
      item.product_id &&
      item.product_data?.slug !== 'discount'
    )
    .reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);
}

getNetTotal(order: any): number {
  return (
    this.getGrossTotal(order) -
    this.getDiscountLineItem(order) -
    this.getCouponTotal(order)
  );
}

getFinalTotal(order: any): number {
  return (
    this.getNetTotal(order) +
    this.getOrderTax(order) +
    this.getCashbackFee(order) +
    this.getServiceCharge(order)
  );
}

getStatusLabel(value: string): string {
  const status = this.orderStatuses.find(s => s.value === value);
  return status ? status.label : value;
}

selectStatus(status: string) {
  this.activeFilter = status;
  this.selectedStatus = status;
  this.showMoreStatuses = false;
  this.setFilter(status);
}

visibleStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partial-refund', label: 'Partial Refunded' }
];

hasEbtTag(item: any): boolean {
  const ebtMeta = item?.meta_data?.find(
    (m: any) => m.key === '_is_ebt_eligible'
  );

  return ebtMeta?.value === '1';
}


async clearDateFilter() {

  this.fromDateValue = '';
  this.toDateValue = '';

  this.fromDateApi = '';
  this.toDateApi = '';

  this.selectedDateText = '';
  this.filterType = '';

  this.page = 1;
  this.orders = [];
  this.hasMore = true;

  await this.loadStatusCounts();
  await this.loadOrders();
}

async applyDateFilter() {
  this.countRequestId++;
  this.dateError = '';
  if (!this.fromDateValue || (this.dateFilterTab === 'range' && !this.toDateValue)) {
    this.dateError = this.dateFilterTab === 'range' ? 'Select both From and To dates.' : 'Select a date.';
    return;
  }

  // Auto swap if From > To
  if (
    this.dateFilterTab === 'range' &&
    this.fromDateValue &&
    this.toDateValue &&
    new Date(this.fromDateValue) > new Date(this.toDateValue)
  ) {
    const temp = this.fromDateValue;
    this.fromDateValue = this.toDateValue;
    this.toDateValue = temp;
  }

  if (!this.fromDateValue) {
    return;
  }

  // Single Date
  if (this.dateFilterTab === 'date') {

    this.filterType = 'date';

    this.fromDateApi =
      this.fromDateValue.split('T')[0];

    this.toDateApi =
      this.fromDateApi;

    this.selectedDateText =
      this.fromDateApi;
  }

  // Date Range
  else {

    if (!this.toDateValue) {
      return;
    }

    this.filterType = 'range';

    this.fromDateApi =
      this.fromDateValue.split('T')[0];

    this.toDateApi =
      this.toDateValue.split('T')[0];

    this.selectedDateText =
      `${this.fromDateApi} - ${this.toDateApi}`;
  }

  this.showDateModal = false;
  this.calendarMode = null;

  this.page = 1;
  this.orders = [];
  this.hasMore = true;

  await this.loadOrders();
}

resetDateModal() {

  this.showDateModal = false;

  this.calendarMode = null;

  this.dateFilterTab = this.filterType === 'range' ? 'range' : 'date';
}

openSingleDate() {
  if (!this.fromDateValue) this.fromDateValue = this.maxDate;
  this.calendarMode = 'single';
}

openFromDate() {
  if (!this.fromDateValue) this.fromDateValue = this.maxDate;
  this.calendarMode = 'from';
}

openToDate() {
  if (!this.toDateValue) this.toDateValue = this.fromDateValue || this.maxDate;
  this.calendarMode = 'to';
}

closeCalendar() {
  //this.calendarMode = null;
}

switchToDateTab() {
  if (this.dateFilterTab === 'date') return;

  this.dateFilterTab = 'date';

  // Clear range values
  this.fromDateValue = '';
  this.toDateValue = '';

  this.calendarMode = null;
}

switchToRangeTab() {
  if (this.dateFilterTab === 'range') return;

  this.dateFilterTab = 'range';

  // Clear single date value
  this.fromDateValue = '';
  this.toDateValue = '';

  this.calendarMode = null;
}

onToDateChange() {

  if (
    this.fromDateValue &&
    this.toDateValue &&
    new Date(this.fromDateValue) > new Date(this.toDateValue)
  ) {

    const temp = this.fromDateValue;
    this.fromDateValue = this.toDateValue;
    this.toDateValue = temp;
  }


}
}