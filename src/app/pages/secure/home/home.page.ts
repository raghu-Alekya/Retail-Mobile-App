import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AssetsService } from 'src/app/services/assets/assets.service'; 
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    standalone: false
})
export class HomePage implements OnInit {
  stores: { id: string; storeName?: string; storeCode?: string }[] = [];
  selectedStoreId = '';
  statusCountsError = '';
  statusCountsLoading = false;
  private statusRequestId = 0;

  private loadStores() {
    try {
      const savedStores = JSON.parse(localStorage.getItem('merchant_stores') || '[]');
      this.stores = Array.isArray(savedStores) ? savedStores.filter(store => !!store?.id) : [];
      const savedStore = JSON.parse(localStorage.getItem('selected_store') || 'null');
      const selectedStore = this.stores.find(store => store.id === savedStore?.id) || this.stores[0];
      this.selectedStoreId = selectedStore?.id || '';
      if (selectedStore) localStorage.setItem('selected_store', JSON.stringify(selectedStore));
      else localStorage.removeItem('selected_store');
    } catch {
      this.stores = [];
      this.selectedStoreId = '';
      localStorage.removeItem('selected_store');
    }
  }

  async onStoreChange(storeId: string) {
    const store = this.stores.find(item => item.id === storeId);
    if (!store) return;
    this.selectedStoreId = store.id;
    localStorage.setItem('selected_store', JSON.stringify(store));
    await Promise.all([this.loadDashboardStats(), this.loadDailyChart()]);
  }

  isChartLoading: boolean = false;
  chartError = '';
  private chartRequestId = 0;
  chartType: string = 'sales'; // default
  content_loaded: boolean = false;
  reports: any[] = [];
  error: string | null = null;
  intervalId: any;
  salesChart: any;
  currencySymbol: string = '';
dailyLabels: string[] = [];
dailyTotals: number[] = [];
  statuses = [
  
    { key: 'wc-completed', label: 'Completed', icon: 'checkmark-circle', count: 0, color: "#66BB6A"},
    { key: 'wc-cancelled', label: 'Cancelled', icon: 'close-circle', count: 0, color: "#EF5350"},
    { key: 'wc-refunded', label: 'Refunded', icon: 'refresh-circle', count: 0, color: "#AB47BC"},
    { key: 'partial-refund', label: 'Partially Refunded', icon: 'refresh-circle', count: 0, color: "#26A69A" },
    { key: 'wc-pending', label: 'Pending', icon: 'time', count: 0, color: "#386EDA"},
    // { key: 'wc-on-hold', label: 'On Hold', icon: 'pause-circle', count: 0, color: "#29B6F6"},
    // { key: 'wc-processing', label: 'Processing', icon: 'cart', count: 0, color: "#E1AB20" },
  ];

  statusIcons: any = {
    processing: 'cart',
    completed: 'checkmark-circle',
    pending: 'time',
    cancelled: 'close-circle'
  };

  slideOpts = {
    slidesPerView: 'auto',
    spaceBetween: 0,
    freeMode: true
  };

  items = [
    { title: 'Orders', icon: 'bag-handle', route: '/orders-list', bg_color: '#FFF6F6', color:'#FE6464' },
    { title: 'Products', icon: 'cube', route: '/products-list',bg_color: '#fff5e7', color:'#ae8852'   },
    { title: 'Customers', icon: 'people', route: '/secure/customers',bg_color: '#efedfe', color:'#635c99' },
    { title: 'Employees', icon: 'person-circle', route: '/users',bg_color: '#fffee7', color:'#b9b434' },
    { title: 'Reports', icon: 'stats-chart', route: '/reports',bg_color: '#eef4ff', color:'#3763a7' },
    { title: 'POS Closing', icon: 'cash', route: '/secure/pos-closing', bg_color: '#EAF7ED', color:'#2E7D32' },
    { title: 'Settings', icon: 'settings', route: '/pos-settings',bg_color: '#E6F0F8', color:'#4E718D' },
    { title: 'Shifts', icon: 'time', route: '/shifts',bg_color: '#fff4fa', color:'#7f3667' },
    { title: 'Payments', icon: 'card', route: '/order-payments',bg_color: '#eaf7ed', color:'#61ab72' },
    { title: 'Vendors', icon: 'business', route: '/vendors',bg_color: '#FFF6F6', color:'#D35400' },
    { title: 'Coupons', icon: 'pricetag', route: '/coupons',bg_color: '#eef4ff', color:'#3763a7' },
    { title: 'Discounts', icon: 'ticket', route: '/discounts',bg_color: '#fff5e7', color:'#e1ab20' },
    //{ title: 'Media', icon: 'images', route: '/media',bg_color: '#FEECEC', color:'#FE6464' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private assetsService : AssetsService
  ) {}

  ngOnInit() {
    this.loadStores();
    this.assetsService.assets$.subscribe(assets => {
      this.currencySymbol = assets?.currency_symbol;
    });
    
  }

  // 🔥 ADD THIS (KEY FIX)
 async ionViewDidEnter() {
  this.loadStores();
  await this.loadDashboardStats();
  await this.loadDailyChart(); 
}


  async loadDashboardStats() {
    const requestId = ++this.statusRequestId;
    const storeId = this.selectedStoreId;
    this.statusCountsError = '';
    this.statuses.forEach(status => status.count = 0);
    if (!storeId) { this.statusCountsLoading = false; return; }
    this.statusCountsLoading = true;
    try {
      const counts = await this.authService.getPchOrderStatusCounts(storeId);
      if (requestId !== this.statusRequestId) return;
      this.statuses.forEach(status => {
        const key = status.key.replace(/^wc-/, '').replace(/-/g, '_');
        status.count = counts[key] ?? 0;
      });
    } catch {
      if (requestId === this.statusRequestId) this.statusCountsError = 'Order counts could not be loaded. Please try again.';
    } finally {
      if (requestId === this.statusRequestId) this.statusCountsLoading = false;
    }
  }

renderChart() {

  const canvas = document.getElementById('dailySalesChart') as HTMLCanvasElement;

  if (!canvas) return;   // 🔥 Prevent crash

  if (this.salesChart) {
    this.salesChart.destroy();
  }

  const isSales = this.chartType === 'sales';

  this.salesChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: this.dailyLabels,
      datasets: [{
        label: isSales ? 'Sales (Last 7 Days)' : 'Orders (Last 7 Days)',
        data: this.dailyTotals,
        fill: true,
        tension: 0.4,
        borderColor: isSales ? '#1e3a8a' : '#2e7d32',
        backgroundColor: isSales
          ? 'rgba(30, 58, 138, 0.15)'
          : 'rgba(46, 125, 50, 0.15)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: isSales ? '#1e3a8a' : '#2e7d32',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: (value) => {
              const amount = Number(value);
              return isSales && Math.abs(amount) >= 1000
                ? (amount / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'k'
                : value;
            }
          }
        }
      }
    }
  });
}
formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);

  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });

  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  return `${day}${suffix}, ${month}`;
}
onChartTypeChange() {
  this.loadDailyChart();
}
async loadDailyChart() {
  const requestId = ++this.chartRequestId;
  const storeId = this.selectedStoreId;
  this.chartError = '';
  this.dailyLabels = [];
  this.dailyTotals = [];
  if (this.salesChart) { this.salesChart.destroy(); this.salesChart = null; }
  if (!storeId) { this.isChartLoading = false; return; }
  this.isChartLoading = true;
  const dayKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const end = new Date();
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    keys.push(dayKey(date));
  }
  try {
    const orders = await this.authService.getPchDailyOrders(storeId);
    if (requestId !== this.chartRequestId) return;
    const totals: Record<string, number> = {};
    orders.forEach(order => {
      // Preserve the calendar date supplied by the store, whether separated by T or space.
      const day = String(order.date_created || '').slice(0, 10);
      if (!keys.includes(day)) return;
      const amount = Number(order.total || 0);
      totals[day] = (totals[day] || 0) + (this.chartType === 'orders' ? 1 : Number.isFinite(amount) ? amount : 0);
    });
    this.dailyLabels = keys.map(key => this.formatDateLabel(key + 'T12:00:00'));
    this.dailyTotals = keys.map(key => Math.round((totals[key] || 0) * 100) / 100);
  } catch {
    if (requestId === this.chartRequestId) this.chartError = 'Daily sales could not be loaded. Please try again.';
  } finally {
    if (requestId === this.chartRequestId) {
      this.isChartLoading = false;
      setTimeout(() => { if (requestId === this.chartRequestId && !this.chartError) this.renderChart(); }, 50);
    }
  }
}
// async loadDailyChart() {

//   this.isChartLoading = true;   // 🔥 start loader

//   const end = new Date();
//   const start = new Date();
//   start.setDate(end.getDate() - 6);

//   const orders = await this.authService.getDailySales(
//     start.toISOString().split('T')[0],
//     end.toISOString().split('T')[0]
//   );

//   const map: any = {};

//   orders.forEach((order: any) => {
//     const day = order.date_created.split('T')[0];

//     if (this.chartType === 'sales') {
//       const net =
//         parseFloat(order.total) -
//         parseFloat(order.total_refunded || 0);

//       map[day] = (map[day] || 0) + net;
//     } else {
//       map[day] = (map[day] || 0) + 1;
//     }
//   });

//   const labels: string[] = [];
//   const totals: number[] = [];

//   for (let i = 6; i >= 0; i--) {
//     const d = new Date();
//     d.setDate(end.getDate() - i);
//     const key = d.toISOString().split('T')[0];

//     labels.push(this.formatDateLabel(key));
//     totals.push(map[key] || 0);
//   }

//   this.dailyLabels = labels;
//   this.dailyTotals = totals;

//   this.renderChart();

//   this.isChartLoading = false;  // 🔥 stop loader
// }
}
