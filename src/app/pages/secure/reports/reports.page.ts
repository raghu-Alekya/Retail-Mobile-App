import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chart } from 'chart.js/auto';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
    selector: 'app-reports',
    templateUrl: './reports.page.html',
    styleUrls: ['./reports.page.scss'],
    standalone: false
})
export class ReportsPage implements AfterViewInit, OnDestroy {

  // ===== STATE =====
  currentMonth: string = '';
  date: string = this.localDateKey(new Date());
  activeTab: 'sales' | 'shift' | 'inventory' = 'sales';
  salesFilter: 'daily' | 'weekly' | 'monthly' = 'daily';
  salesLoading = false;
  shiftLoading = false;
  shiftError = '';
  private shiftRequestId = 0;
  private shiftRequestKey = '';
  private shiftRenderTimer: ReturnType<typeof setTimeout>;
  salesError = '';
  private salesRequestId = 0;
  private salesRequestKey = '';
  private salesRenderTimer: ReturnType<typeof setTimeout>;

  // ===== CHART REFERENCES =====
  @ViewChild('employeeDateInput') employeeDateInput?: ElementRef<HTMLInputElement>;
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
    if (this.activeTab === 'shift') void this.loadShiftReport(this.date);
    else void this.loadSales();
  }

  ngAfterViewInit() { void this.loadSales(); }

  ngOnDestroy() {
    this.salesRequestId++;
    this.shiftRequestId++;
    clearTimeout(this.shiftRenderTimer);
    clearTimeout(this.salesRenderTimer);
    this.ordersChart?.destroy(); this.salesChart?.destroy();
    this.shiftOrdersChart?.destroy(); this.shiftSalesChart?.destroy();
  }

  // ================= SALES =================
  async loadSales() {
    let merchantId = '';
    let storeId = '';
    try {
      merchantId = JSON.parse(localStorage.getItem('merchant_data') || 'null')?.id || '';
      storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || '';
    } catch {}
    const type = this.salesFilter;
    const key = merchantId + ':' + storeId + ':' + type;
    if (this.salesLoading && key === this.salesRequestKey) return;
    const requestId = ++this.salesRequestId;
    this.salesRequestKey = key;
    this.salesLoading = true;
    this.salesError = '';
    this.sales = {};
    clearTimeout(this.salesRenderTimer);
    this.ordersChart?.destroy(); this.ordersChart = null;
    this.salesChart?.destroy(); this.salesChart = null;
    try {
      const report = await this.authService.getPchSalesReport(type, merchantId, storeId);
      if (requestId !== this.salesRequestId) return;
      this.sales = report;
      this.currentMonth = new Date().toLocaleString('default', { month: 'long' });
      this.salesRenderTimer = setTimeout(() => {
        if (requestId !== this.salesRequestId || this.activeTab !== 'sales') return;
        this.buildOrdersChart();
        this.buildSalesChart();
      }, 100);
    } catch (error: any) {
      if (requestId === this.salesRequestId) this.salesError = error?.message || 'Unable to load sales report. Please try again.';
    } finally {
      if (requestId === this.salesRequestId) this.salesLoading = false;
    }
  }
  onSalesFilterChange(event: any) {
    this.salesFilter = event.detail.value;
    this.loadSales();
  }

  openDatePicker() {
    const input = this.employeeDateInput?.nativeElement as (HTMLInputElement & { showPicker?: () => void }) | undefined;
    if (!input) return;
    input.focus();
    try {
      if (typeof input.showPicker === 'function') { input.showPicker(); return; }
    } catch { /* Older WebViews fall back to the date input click. */ }
    input.click();
  }

  // ================= SHIFT REPORT =================
async loadShiftReport(date: string) {
  let merchantId = '';
  let storeId = '';
  try {
    merchantId = JSON.parse(localStorage.getItem('merchant_data') || 'null')?.id || '';
    storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || '';
  } catch {}
  const key = merchantId + ':' + storeId + ':' + date;
  if (this.shiftLoading && key === this.shiftRequestKey) return;
  const requestId = ++this.shiftRequestId;
  this.shiftRequestKey = key;
  this.shiftError = '';
  this.totalSales = 0;
  this.totalOrders = 0;
  this.shiftData = { date, total_sales: 0, total_orders: 0, shifts: [] };
  clearTimeout(this.shiftRenderTimer);
  this.shiftOrdersChart?.destroy(); this.shiftOrdersChart = null;
  this.shiftSalesChart?.destroy(); this.shiftSalesChart = null;
  if (this.isFutureDate(date)) { this.shiftLoading = false; return; }
  this.shiftLoading = true;
  try {
    const report = await this.authService.getPchEmployeeSales(date, merchantId, storeId);
    if (requestId !== this.shiftRequestId) return;
    const employees = new Map<string, { shift_name: string; orders: number; sales: number }>();
    report.shifts.forEach(shift => {
      const name = shift.shift_name.trim() || 'Unknown employee';
      const employee = employees.get(name) || { shift_name: name, orders: 0, sales: 0 };
      employee.orders += shift.orders;
      employee.sales += shift.sales;
      employees.set(name, employee);
    });
    this.shiftData = { ...report, shifts: Array.from(employees.values()).map(employee => ({ ...employee, sales: Math.round(employee.sales * 100) / 100 })) };
    this.totalSales = report.total_sales;
    this.totalOrders = report.total_orders;
    this.shiftRenderTimer = setTimeout(() => {
      if (requestId !== this.shiftRequestId || this.activeTab !== 'shift') return;
      this.buildShiftOrdersChart();
      this.buildShiftSalesChart();
    }, 100);
  } catch (error: any) {
    if (requestId === this.shiftRequestId) this.shiftError = error?.message || 'Unable to load employee sales. Please try again.';
  } finally {
    if (requestId === this.shiftRequestId) this.shiftLoading = false;
  }
}

onDateChange(event: any) {

  const selectedDate = event?.detail?.value || event?.target?.value;

  if (!selectedDate) return;

  this.date = selectedDate.substring(0, 10);

  if (this.activeTab === 'shift') {
    this.loadShiftReport(this.date);
  }
}


private localDateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

isFutureDate(date: string) {
  return date.slice(0, 10) > this.localDateKey(new Date());
}
  // ================= TAB CHANGE =================
  onTabChange(event: any) {
    this.activeTab = event.detail.value;

    setTimeout(() => {
      if (this.activeTab === 'sales') void this.loadSales();

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
    if (!this.shiftData?.shifts?.length || !this.shiftOrdersChartRef?.nativeElement) return;

    const labels = this.shiftData.shifts.map((s: any) =>
      s.shift_name
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
      s.shift_name
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