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
    await this.loadOrders();

    this.assetsService.assets$.subscribe(assets => {
      this.currencySymbol = assets?.currency_symbol;
    });
  }

  /* ================================
     LOAD ORDERS
  ================================= */
  setFilter(type: string) {
    this.activeFilter = type;
    this.selectedStatus = type;
    this.page = 1;
    this.orders = [];
    this.hasMore = true;
    this.loading = false; // release lock to prevent deadlock
    this.loadOrders();
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
  selectStatus(status: string) {
    if (this.loading) return;
    this.selectedStatus = status;
    this.activeFilter = status;
    this.setFilter(status);
    // reload when filter changes
    this.page = 1;
    this.orders = [];
    this.hasMore = true;

    this.loadOrders();
  }

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
}