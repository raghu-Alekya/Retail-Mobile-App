import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AssetsService } from 'src/app/services/assets/assets.service';

@Component({
  standalone: true,
  selector: 'app-order-list',
  templateUrl: './orders-list.page.html',
  styleUrls: ['./orders-list.page.scss'],
  imports: [IonicModule, CommonModule, RouterModule],
})
export class OrderListPage implements OnInit {

  orders: any[] = [];
  page = 1;
  loading = false;
  hasMore = true;
  activeFilter: string = 'all';
  selectedStatus = 'all';
  currencySymbol: string = '';

  searchTerm: string = '';
  searchTimeout: any;

  expandedOrderId: number | null = null;

  constructor(
    private authService: AuthService,
    private assetsService: AssetsService
  ) { }

  async ngOnInit() {

  await this.loadStatusCounts(); // <-- add this

  await this.loadOrders();

  this.assetsService.assets$.subscribe(assets => {
    this.currencySymbol = assets?.currency_symbol;
  });
}

async loadStatusCounts() {

  const promises = this.statuses.map(async (s) => {
    try {
      const count = await this.authService.getDashboardStats(s.key);
      return count;
    } catch {
      return 0;
    }
  });

  const results = await Promise.all(promises);

  this.statuses.forEach((status, index) => {
    status.count = Number(results[index]) || 0;
  });
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

  if (value === 'all') {
    return this.statuses.reduce(
      (total, status) => total + status.count,
      0
    );
  }

  const status = this.statuses.find(
    s => s.value === value
  );

  return status?.count || 0;
}

  async loadOrders(event?: any) {

    if (this.loading || !this.hasMore) {
      event?.target?.complete();
      return;
    }

    this.loading = true;

    try {
      let allData: any[] = [];

      let activeSearchTerm = this.searchTerm;
      let activeStatus = this.selectedStatus;

      if (this.searchTerm) {
        let searchVal = this.searchTerm.replace('#', '').trim();
        
        // 1. EXACT MATCH CHECK
        // If they typed a number, ask the API for the exact order ID first.
        if (this.page === 1 && searchVal && !isNaN(Number(searchVal))) {
          try {
            let exactData = await this.authService.getOrders(
              1,
              searchVal,
              this.selectedStatus !== 'all' ? this.selectedStatus : ''
            );
            
            if (this.searchTerm !== activeSearchTerm || this.selectedStatus !== activeStatus) return;

            if (Array.isArray(exactData) && exactData.length > 0) {
              let exactMatch = exactData.find(o => o.id?.toString() === searchVal);
              if (exactMatch) {
                // If we found the EXACT order, exclude the rest and show ONLY this one
                this.orders = [exactMatch];
                this.hasMore = false;
                this.loading = false;
                event?.target?.complete();
                return;
              }
            }
          } catch (e) {
            console.error('Exact search error:', e);
          }
        }

        // 2. PARTIAL MATCH BATCH SEARCH (Fallback)
        let keepFetching = true;
        let loopCount = 0;
        
        while (keepFetching) {
          let promises = [];
          for (let i = 0; i < 5; i++) {
             promises.push(
                this.authService.getOrders(this.page + i, '', this.selectedStatus !== 'all' ? this.selectedStatus : '')
                .catch(() => [])
             );
          }
          let results = await Promise.all(promises);
          
          // ABORT if the user changed the search term or status while we were fetching
          if (this.searchTerm !== activeSearchTerm || this.selectedStatus !== activeStatus) {
             return;
          }
          
          let foundDataInBatch = false;
          let newMatches: any[] = [];
          
          for (let pageData of results) {
            if (Array.isArray(pageData) && pageData.length > 0) {
              foundDataInBatch = true;
              let matches = pageData.filter(order =>
                order.id?.toString().includes(searchVal)
              );
              newMatches = [...newMatches, ...matches];
            }
          }
          
          if (newMatches.length > 0) {
             this.orders = this.orders.length === 0
               ? newMatches
               : [...this.orders, ...newMatches];
          }
          
          this.page += 5;
          loopCount++;
          
          if (!foundDataInBatch || this.orders.length >= 10 || loopCount >= 10) {
             keepFetching = false;
             if (!foundDataInBatch) {
               this.hasMore = false;
             }
          }
        }
      } else {
        let data = await this.authService.getOrders(
          this.page,
          '',
          this.selectedStatus !== 'all' ? this.selectedStatus : ''
        );

        // ABORT if the user changed the search term or status while we were fetching
        if (this.searchTerm !== activeSearchTerm || this.selectedStatus !== activeStatus) {
           return;
        }

        if (Array.isArray(data) && data.length > 0) {
          this.orders = this.page === 1
            ? data
            : [...this.orders, ...data];
          this.page++;
        } else {
          this.hasMore = false;
        }
      }

    } catch (err) {
      console.error('Order load error:', err);
    }

    this.loading = false;
    event?.target?.complete();
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

  getDiscountLineItem(order: any): number {
  const discountItem = order.line_items?.find(
    (i: any) => i.product_data?.slug?.toLowerCase() === 'discount'
  );

  return Math.abs(Number(discountItem?.subtotal || 0));
}

getTotalItemCount(order: any): number {
  return (order.line_items || [])
    .filter((item: any) => item.product_data?.slug !== 'discount')
    .reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
}

getCouponTotal(order: any): number {
  return (order.coupon_lines || [])
    .reduce((sum: number, c: any) => sum + Number(c.discount || 0), 0);
}

getServiceCharge(order: any): number {
  return Number(order.shipping_total || 0);
}

getCashbackFee(order: any): number {
  const hasCashback = (order.line_items || []).some(
    (item: any) => item.product_data?.slug === 'cashback'
  );

  if (!hasCashback) {
    return 0;
  }

  return (order.fee_lines || []).reduce(
    (sum: number, fee: any) => sum + Number(fee.total || 0),
    0
  );
}

getGrossTotal(order: any): number {

  const items = (order.line_items || [])
    .filter((item: any) => item.product_data?.slug !== 'discount');

  const total = items.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal || 0),
    0
  );

  console.log('Gross Total =', total);

  return total;
}

getNetTotal(order: any): number {
  return this.getGrossTotal(order) - this.getCouponTotal(order);
}

getFinalTotal(order: any): number {
  return (
    this.getNetTotal(order) +
    this.getOrderTax(order) -
    this.getDiscountLineItem(order) +
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
}