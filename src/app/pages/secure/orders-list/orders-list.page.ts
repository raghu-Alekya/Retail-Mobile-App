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
  currencySymbol:string = '';

  searchTerm: string = '';
  hasMore = true;
  expandedOrders = new Set<number>();

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


  async loadOrders(event?: any) {
    if (this.loading || !this.hasMore) {
      event?.target.complete();
      return;
    }

    this.loading = true;

    try {
      const data = await this.authService.getOrders(
        this.page,
        this.searchTerm
      );

      if (Array.isArray(data) && data.length > 0) {
        this.orders.push(...data);
        this.page++;
      } else {
        this.hasMore = false;
        if (event) event.target.disabled = true;
      }

    } catch (err) {
      console.error(err);
    }

    this.loading = false;
    event?.target.complete();
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value?.trim() || '';
    this.page = 1;
    this.orders = [];
    this.hasMore = true;

    this.loadOrders();
  }

  // 1️⃣ STATUS → COLOR
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

  // 2️⃣ TIME AGO
  timeAgo(date: string): string {
    const diff = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // 3️⃣ ITEMS COUNT
  getItemsCount(order: any): number {
    return order?.line_items?.length || 0;
  }

  // 4️⃣ PRODUCT IMAGE (safe)
  getProductImage(item: any): string {
    return item?.image?.src || 'assets/img/placeholder.png';
  }

  // 5️⃣ SHIPPING METHOD
  getShippingMethod(order: any): string {
    return order?.shipping_lines?.[0]?.method_title || '—';
  }

  trackById(_: number, order: any) {
    return order.id;
  }

  toggleExpand(orderId: number) {
    if (this.expandedOrders.has(orderId)) {
      this.expandedOrders.delete(orderId);
    } else {
      this.expandedOrders.add(orderId);
    }
  }

  isExpanded(orderId: number): boolean {
    return this.expandedOrders.has(orderId);
  }
}
