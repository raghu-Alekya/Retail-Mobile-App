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
  isChartLoading: boolean = false;
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
    { key: 'wc-pending', label: 'Pending', icon: 'time', count: 0, color: "#386EDA"},
    { key: 'wc-cancelled', label: 'Cancelled', icon: 'close-circle', count: 0, color: "#EF5350"},
    { key: 'wc-refunded', label: 'Refunded', icon: 'refresh-circle', count: 0, color: "#AB47BC"},
    { key: 'partial-refund', label: 'Partially Refunded', icon: 'refresh-circle', count: 0, color: "#26A69A" },
    { key: 'wc-failed', label: 'Failed', icon: 'alert-circle', count: 0, color: "#FF7043"},
    // { key: 'wc-on-hold', label: 'On Hold', icon: 'pause-circle', count: 0, color: "#29B6F6"},
    // { key: 'wc-processing', label: 'Processing', icon: 'cart', count: 0, color: "#E1AB20" },
    { key: 'trash', label: 'Trash', icon: 'trash', count: 0, color: "#8D6E63"},
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
    { title: 'Media', icon: 'images', route: '/media',bg_color: '#FEECEC', color:'#FE6464' },
    { title: 'Settings', icon: 'settings', route: '/pos-settings',bg_color: '#E6F0F8', color:'#4E718D' },
    { title: 'Shifts', icon: 'time', route: '/shifts',bg_color: '#fff4fa', color:'#7f3667' },
    { title: 'Payments', icon: 'card', route: '/order-payments',bg_color: '#eaf7ed', color:'#61ab72' },
    { title: 'Vendors', icon: 'business', route: '/vendors',bg_color: '#FFF6F6', color:'#D35400' },
    { title: 'Coupons', icon: 'pricetag', route: '/coupons',bg_color: '#eef4ff', color:'#3763a7' },
    { title: 'Discounts', icon: 'ticket', route: '/discounts',bg_color: '#fff5e7', color:'#e1ab20' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private assetsService : AssetsService
  ) {}

  ngOnInit() {
    this.assetsService.assets$.subscribe(assets => {
      this.currencySymbol = assets?.currency_symbol;
    });
    
  }

  // 🔥 ADD THIS (KEY FIX)
 async ionViewDidEnter() {
  await this.loadDashboardStats();
  await this.loadDailyChart(); 
}


  async loadDashboardStats() {

  const promises = this.statuses.map(async (s) => {
    try {
      const count = await this.authService.getDashboardStats(s.key);
      return { status: 'fulfilled', value: count };
    } catch (error) {
      return { status: 'rejected', reason: error };
    }
  });

  const responses = await Promise.all(promises);

  responses.forEach((result: any, index: number) => {

    if (result.status === 'fulfilled') {
      
      this.statuses[index].count = Number(result.value) || 0;
    } else {
      console.error(
        `Dashboard stat failed: ${this.statuses[index].key}`,
        result.reason
      );

      this.statuses[index].count = 0;
    }

  });
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
        label: isSales ? 'Net Sales (Last 7 Days)' : 'Orders (Last 7 Days)',
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
      maintainAspectRatio: false
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

  this.isChartLoading = true;   // 🔥 show emoji

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  try {

    const orders = await this.authService.getDailySales(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );

    const map: any = {};

    orders.forEach((order: any) => {
      const day = order.date_created.split('T')[0];

      if (this.chartType === 'sales') {
        const net =
          parseFloat(order.total) -
          parseFloat(order.total_refunded || 0);

        map[day] = (map[day] || 0) + net;
      } else {
        map[day] = (map[day] || 0) + 1;
      }
    });

    const labels: string[] = [];
    const totals: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(end.getDate() - i);
      const key = d.toISOString().split('T')[0];

      labels.push(this.formatDateLabel(key));
      totals.push(map[key] || 0);
    }

    this.dailyLabels = labels;
    this.dailyTotals = totals;

  } catch (error) {
    console.error('Chart load error:', error);
  } finally {

    this.isChartLoading = false;  // 🔥 hide emoji

    setTimeout(() => {
      this.renderChart();        // render AFTER canvas appears
    }, 50);

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
