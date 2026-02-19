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
})
export class HomePage implements OnInit {
  
  content_loaded: boolean = false;
  reports: any[] = [];
  error: string | null = null;
  intervalId: any;
  salesChart: any;
  currencySymbol: string = '';
dailyLabels: string[] = [];
dailyTotals: number[] = [];
  statuses = [
    { key: 'wc-processing', label: 'Processing', icon: 'cart', count: 0, color: "#E1AB20" },
    { key: 'wc-completed', label: 'Completed', icon: 'checkmark-circle', count: 0, color: "#66BB6A"},
    { key: 'wc-pending', label: 'Pending', icon: 'time', count: 0, color: "#386EDA"},
    { key: 'wc-cancelled', label: 'Cancelled', icon: 'close-circle', count: 0, color: "#EF5350"},
    { key: 'wc-refunded', label: 'Refunded', icon: 'refresh-circle', count: 0, color: "#AB47BC"},
    { key: 'wc-failed', label: 'Failed', icon: 'alert-circle', count: 0, color: "#FF7043"},
    { key: 'wc-on-hold', label: 'On Hold', icon: 'pause-circle', count: 0, color: "#29B6F6"},
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
    { title: 'Products', icon: 'cube', route: '/products-list',bg_color: '#EFEDFE', color:'#635C99'   },
    { title: 'Customers', icon: 'people', route: '/users/customers',bg_color: '#FFF5E7', color:'#AE8852' },
    { title: 'Employees', icon: 'person-circle', route: '/users/employees',bg_color: '#EEF4FF', color:'#3763A7' },
    { title: 'Reports', icon: 'stats-chart', route: '/reports',bg_color: '#FFFEE7', color:'#B9B434' },
    { title: 'Media Library', icon: 'images', route: '/media',bg_color: '#FEECEC', color:'#FE6464' },
    { title: 'Shop Settings', icon: 'settings', route: '/pos-settings',bg_color: '#E6F0F8', color:'#4E718D' },
    { title: 'Shifts', icon: 'time', route: '/shifts',bg_color: '#ECEBFD', color:'#46437F' },
    { title: 'Payments', icon: 'card', route: '/order-payments',bg_color: '#F2FFE1', color:'#7BB02F' },
    { title: 'Vendors', icon: 'business', route: '/vendors',bg_color: '#FFF6F6', color:'#D35400' },
    { title: 'Coupons', icon: 'pricetag', route: '/coupons',bg_color: '#FFF6F6', color:'#117A65' },
    { title: 'Discounts', icon: 'ticket', route: '/discounts',bg_color: '#E8F8F5', color:'#148F77' },
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
  await this.loadDailySalesChart();
}


  async loadDashboardStats() {
    try {
      const responses = await Promise.all(
        this.statuses.map(s =>
          this.authService.getDashboardStats(s.key)
        )
      );

      responses.forEach((res, index) => {
        this.statuses[index].count = res ?? 0;
      });

    } catch (error) {
      console.error('Dashboard API error', error);
    }
  }

  async loadDailySalesChart() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 8); // last 7 days

  const orders = await this.authService.getDailySales(
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );

  const map: any = {};

  orders.forEach((order: any) => {
    const day = order.date_created.split('T')[0];
    map[day] = (map[day] || 0) + parseFloat(order.total);
  });
  this.dailyLabels = Object.keys(map).map(date =>
    this.formatDateLabel(date)
  );
  this.dailyTotals = Object.values(map);

  this.renderChart();
}

renderChart() {
  const canvas: any = document.getElementById('dailySalesChart');
  if (this.salesChart) {
    this.salesChart.destroy();
  }

  this.salesChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: this.dailyLabels,
      datasets: [
        {
          label: 'Daily Sales',
          data: this.dailyTotals,
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              autoSkip: true
            }
          },
          y: { beginAtZero: true }
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

}
