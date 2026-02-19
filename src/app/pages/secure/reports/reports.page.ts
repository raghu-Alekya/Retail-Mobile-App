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
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class ReportsPage implements AfterViewInit {

  // ===== BASIC STATE =====
  date: string = new Date().toISOString().substring(0, 10);

  activeTab: 'sales' | 'shift' | 'inventory' = 'sales';
  salesFilter: 'daily' | 'weekly' | 'monthly' = 'daily';

  // ===== CHART REFERENCES =====
  @ViewChild('ordersChart') ordersChartRef!: ElementRef;
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  // @ViewChild('employeeChart') employeeChartRef!: ElementRef;
  @ViewChild('shiftOrdersChart') shiftOrdersChartRef!: ElementRef;
@ViewChild('shiftSalesChart') shiftSalesChartRef!: ElementRef;

shiftOrdersChart: any = null;
shiftSalesChart: any = null;

shiftData: any = null;


ordersChart: any = null;
salesChart: any = null;
// employeeChart: any = null;


  // ===== DATA =====
  sales: any = {};
  // employeeSales: any[] = [];
  itemSales: any[] = [];

  inventory: any[] = [];
  inventoryPage = 1;
  inventoryHasMore = true;
  inventoryLoading = false;

  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  // ===== LIFECYCLE =====
 ionViewWillEnter() {
  this.loadSales();   // Only sales initially
}


  ngAfterViewInit() {}

  // ===== LOAD ALL DATA =====
  async loadAll() {
    this.loading = true;
    this.error = null;

    this.inventory = [];
    this.inventoryPage = 1;
    this.inventoryHasMore = true;

    try {
      await Promise.all([
        this.loadSales(),
        // this.loadEmployeeSales(),
        this.loadItemSales(),
        this.loadInventory()
      ]);
    } catch (err) {
      console.error(err);
      this.error = 'Failed to load reports';
    } finally {
      this.loading = false;
    }
  }

  // ===== SALES =====
async loadSales() {

  this.sales = await this.authService.loadSales(this.salesFilter);

  console.log("API DATA:", this.sales);

  setTimeout(() => {
    this.buildOrdersChart();
    this.buildSalesChart();
  }, 100);
}



onSalesFilterChange(event: any) {
  this.salesFilter = event.detail.value;
  this.loadSales();
}

  async loadShiftReport() {
    console.log("Date sent:", this.date);
    this.shiftData = await this.authService.loadShiftSales(this.date);

    setTimeout(() => {
      this.buildShiftOrdersChart();
      this.buildShiftSalesChart();
    }, 100);
  }


get currentMonth() {
  const now = new Date();
  return now.toLocaleString('default', { month: 'short', year: 'numeric' });
}

onDateChange() {

  if (this.activeTab === 'sales') {
    this.loadSales();
  }

  if (this.activeTab === 'shift') {
    this.loadShiftReport();
  }

  // if (this.activeTab === 'inventory') {
  //   this.loadInventory();
  // }
}



buildOrdersChart() {

  if (!this.ordersChartRef || !this.sales?.chart?.length) {
    console.log("No orders chart data");
    return;
  }

  const labels = this.sales.chart.map((d: any) => d.label);
  const data   = this.sales.chart.map((d: any) => Number(d.orders));

  this.ordersChart?.destroy();

  this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(75,192,120,0.6)',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


buildSalesChart() {

  if (!this.salesChartRef || !this.sales?.chart?.length) {
    console.log("No sales chart data");
    return;
  }

  const labels = this.sales.chart.map((d: any) => d.label);
  const data   = this.sales.chart.map((d: any) => Number(d.sales));

  this.salesChart?.destroy();

  this.salesChart = new Chart(this.salesChartRef.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(54,162,235,0.6)',
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
            label: (context) => `₹ ${context.parsed.y}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


buildShiftOrdersChart() {

  if (this.shiftOrdersChart) {
  this.shiftOrdersChart.destroy();
}

if (!this.shiftOrdersChartRef || !this.shiftData?.shifts?.length) {
  return; // stop after destroying old chart
}


  const labels = this.shiftData.shifts.map((s: any) => {
  const cleaned = s.shift_name.replace('Shift Start- ', '');
  return cleaned.split(' 2026')[0];  // removes date part
});


  const data = this.shiftData.shifts.map((s: any) =>
    Number(s.orders)
  );

  this.shiftOrdersChart?.destroy();

  this.shiftOrdersChart = new Chart(this.shiftOrdersChartRef.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(75,192,120,0.6)',
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

  if (this.shiftSalesChart) {
  this.shiftSalesChart.destroy();
}

if (!this.shiftSalesChartRef || !this.shiftData?.shifts?.length) {
  return;
}


  const labels = this.shiftData.shifts.map((s: any) => {
  const cleaned = s.shift_name.replace('Shift Start- ', '');
  return cleaned.split(' 2026')[0];  // removes date part
});


  const data = this.shiftData.shifts.map((s: any) =>
    Number(s.sales)
  );

  this.shiftSalesChart?.destroy();

  this.shiftSalesChart = new Chart(this.shiftSalesChartRef.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(54,162,235,0.6)',
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
            label: (context) => `₹ ${context.parsed.y}`
          }
        }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}



  // buildEmployeeChart() {
  //   if (!this.employeeChartRef || !this.employeeSales?.length) return;

  //   const labels = this.employeeSales.map(e => e.employee);
  //   const data = this.employeeSales.map(e => Number(e.total));

  //   this.employeeChart?.destroy();

  //   this.employeeChart = new Chart(this.employeeChartRef.nativeElement, {
  //     type: 'bar',
  //     data: {
  //       labels,
  //       datasets: [{
  //         label: 'Employee Sales',
  //         data
  //       }]
  //     },
  //     options: {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       indexAxis: 'y'
  //     }
  //   });
  // }

  // ===== INVENTORY =====
  async loadItemSales() {
    this.itemSales = await this.authService.loadItemSales(this.date);
  }

  async loadInventory(event?: any) {
    if (this.inventoryLoading || !this.inventoryHasMore) {
      event?.target.complete();
      return;
    }

    this.inventoryLoading = true;

    const res = await this.authService.loadInventory(
      this.date,
      String(this.inventoryPage),
      "50"
    );

    this.inventory.push(...res.items);
    this.inventoryHasMore = res.has_more;
    this.inventoryPage++;

    this.inventoryLoading = false;
    event?.target.complete();
  }

  // ===== TAB SWITCH =====
 onTabChange(event: any) {
  this.activeTab = event.detail.value;

  setTimeout(() => {

    if (this.activeTab === 'sales') {
      this.buildOrdersChart();
      this.buildSalesChart();
    }

    if (this.activeTab === 'shift') {
      this.loadShiftReport();
    }

  }, 100);
}


}
