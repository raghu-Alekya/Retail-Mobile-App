import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chart } from 'chart.js/auto';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ReportsPage implements AfterViewInit {

  // ===== STATE =====
  currentMonth: string = '';
  date: string = new Date().toISOString().substring(0, 10);
  activeTab: 'sales' | 'shift' | 'inventory' = 'sales';
  salesFilter: 'daily' | 'weekly' | 'monthly' = 'daily';

  // ===== CHART REFERENCES =====
  @ViewChild('ordersChart') ordersChartRef!: ElementRef;
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('shiftOrdersChart') shiftOrdersChartRef!: ElementRef;
  @ViewChild('shiftSalesChart') shiftSalesChartRef!: ElementRef;
totalSales: number = 0;
totalOrders: number = 0;
today: string = new Date().toISOString();
salesPerEmployee: any[] = [];
ordersPerEmployee: any[] = [];
  ordersChart: any;
  salesChart: any;
  shiftOrdersChart: any;
  shiftSalesChart: any;

  // ===== DATA =====
  sales: any = {};
  shiftData: any = null;
  itemSales: any[] = [];
  inventory: any[] = [];

  constructor(private authService: AuthService) {}

  // ===== LIFECYCLE =====
  ionViewWillEnter() {
    this.loadSales();
  }

  ngAfterViewInit() {}

  // ================= SALES =================
  async loadSales() {

  this.sales = await this.authService.loadSales(this.salesFilter);

  // ⭐ Set month name
  const now = new Date();
  this.currentMonth = now.toLocaleString('default', { month: 'long' });

  setTimeout(() => {
    this.buildOrdersChart();
    this.buildSalesChart();
  }, 100);

}
  onSalesFilterChange(event: any) {
    this.salesFilter = event.detail.value;
    this.loadSales();
  }

  openDatePicker() {
  const input = document.querySelector('input[type="date"]') as HTMLElement;
  input?.click();
}

  // ================= SHIFT REPORT =================
async loadShiftReport(date: string) {

  const res = await this.authService.loadEmployeeSales(date);

  console.log("SHIFT DATA:", res);

  this.shiftData = res;

  if (!res.shifts || res.shifts.length === 0) {

    this.totalSales = 0;
    this.totalOrders = 0;

    this.shiftOrdersChart?.destroy();
    this.shiftSalesChart?.destroy();

    return;
  }

  this.totalSales = res.total_sales;
  this.totalOrders = res.total_orders;

  setTimeout(() => {
    this.buildShiftOrdersChart();
    this.buildShiftSalesChart();
  }, 100);

}

onDateChange(event: any) {

  const selectedDate = event?.detail?.value || event?.target?.value;

  if (!selectedDate) return;

  this.date = selectedDate.substring(0, 10);

  if (this.activeTab === 'shift') {
    this.loadShiftReport(this.date);
  }
}


isFutureDate(date: string) {
  return new Date(date) > new Date();
}
  // ================= TAB CHANGE =================
  onTabChange(event: any) {
    this.activeTab = event.detail.value;

    setTimeout(() => {
      if (this.activeTab === 'sales') {
        this.buildOrdersChart();
        this.buildSalesChart();
      }

      if (this.activeTab === 'shift') {
        this.loadShiftReport(this.date);
      }
    }, 100);
  }

  // ================= SALES CHART =================
  buildOrdersChart() {
    if (!this.ordersChartRef || !this.sales?.chart?.length) return;

    const labels = this.sales.chart.map((d: any) => d.label);
    const data = this.sales.chart.map((d: any) => Number(d.orders));

    this.ordersChart?.destroy();

    this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#67829d',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  buildSalesChart() {
    if (!this.salesChartRef || !this.sales?.chart?.length) return;

    const labels = this.sales.chart.map((d: any) => d.label);
    const data = this.sales.chart.map((d: any) => Number(d.sales));

    this.salesChart?.destroy();

    this.salesChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#67829d',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$ ${ctx.parsed.y}`
            }
          }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // ================= SHIFT CHARTS =================
  buildShiftOrdersChart() {
    if (!this.shiftData?.shifts?.length) return;

    const labels = this.shiftData.shifts.map((s: any) =>
      s.shift_name.replace('Shift Start- ', '').split(' 202')[0]
    );

    const data = this.shiftData.shifts.map((s: any) => Number(s.orders));

    this.shiftOrdersChart?.destroy();

    this.shiftOrdersChart = new Chart(this.shiftOrdersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#67829d',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  buildShiftSalesChart() {
    if (!this.shiftData?.shifts?.length) return;

    const labels = this.shiftData.shifts.map((s: any) =>
      s.shift_name.replace('Shift Start- ', '').split(' 202')[0]
    );

    const data = this.shiftData.shifts.map((s: any) => Number(s.sales));

    this.shiftSalesChart?.destroy();

    this.shiftSalesChart = new Chart(this.shiftSalesChartRef.nativeElement, {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      data,
      backgroundColor: '#67829d',
      borderRadius: 8
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `$ ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
});
  }
  getCurrentWeekRange() {
  const now = new Date();

  const firstDay = new Date(now);
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)

  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);

  firstDay.setDate(diffToMonday);
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 6);
  lastDay.setHours(23, 59, 59, 999);

  return {
    start: firstDay.toISOString(),
    end: lastDay.toISOString()
  };
}

}