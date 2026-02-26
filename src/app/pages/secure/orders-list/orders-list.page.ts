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

  currencySymbol: string = '';

  searchTerm: string = '';
  searchTimeout: any;

  expandedOrderId: number | null = null;

  constructor(
    private authService: AuthService,
    private assetsService: AssetsService
  ) {}

  async ngOnInit() {
    await this.loadOrders();

    this.assetsService.assets$.subscribe(assets => {
      this.currencySymbol = assets?.currency_symbol;
    });
  }

  /* ================================
     LOAD ORDERS
  ================================= */
  async loadOrders(event?: any) {

    if (this.loading || !this.hasMore) {
      event?.target?.complete();
      return;
    }

    this.loading = true;

    try {
      const data = await this.authService.getOrders(
        this.page,
        this.searchTerm
      );

      if (Array.isArray(data) && data.length > 0) {

        // replace results when new search
        this.orders = this.page === 1
          ? data
          : [...this.orders, ...data];

        // stop infinite scroll when:
        // ✔ searching
        // ✔ results less than page size
        if (this.searchTerm || data.length < 10) {
          this.hasMore = false;
        } else {
          this.page++;
        }

      } else {
        this.hasMore = false;
        if (event) event.target.disabled = true;
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
  onSearch(value: string) {

  const term = value?.trim() || '';

  clearTimeout(this.searchTimeout);

  this.searchTimeout = setTimeout(() => {
    this.searchTerm = term;
    this.page = 1;
    this.orders = [];
    this.hasMore = true;
    this.loading = false;

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
    { label: 'Pending', value: 'pending' }
  ];

  selectedStatus = 'all';

  selectStatus(status: string) {
    this.selectedStatus = status;

    // reload when filter changes
    this.page = 1;
    this.orders = [];
    this.hasMore = true;

    this.loadOrders();
  }

}