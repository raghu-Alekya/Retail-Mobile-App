import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule
} from '@ionic/angular';

import { AuthService } from 'src/app/services/auth/auth.service';
import { AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Chart from 'chart.js/auto';
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
export class ReportsPage implements AfterViewInit  {

  date: string = new Date().toISOString().substring(0, 10);

  activeTab: 'sales' | 'staff' | 'inventory' = 'sales';

  @ViewChild('hourlyChart') hourlyChartRef!: ElementRef;
  @ViewChild('employeeChart') employeeChartRef!: ElementRef;

  hourlyChart: Chart | null = null;
  employeeChart: Chart | null = null;
  sales: any = {};
  employeeSales: any[] = [];
  itemSales: any[] = [];

  inventory: any[] = [];
  inventoryPage = 1;
  inventoryHasMore = true;
  inventoryLoading = false;

  loading = false;
  error: string | null = null;
  constructor(private authService: AuthService) {}

  ionViewWillEnter() {
    this.loadAll();
  }

  ngAfterViewInit() {
    // Charts will be created after data loads
  }

  async loadAll() {
    this.loading = true;
    this.error = null;

    this.inventory = [];
    this.inventoryPage = 1;
    this.inventoryHasMore = true;

    try {
      await Promise.all([
        this.loadSales(),
        this.loadEmployeeSales(),
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

  async loadSales() {
    this.sales = await this.authService.loadSales(this.date);
    this.buildHourlyChart();
  }

  async loadEmployeeSales() {
    this.employeeSales = await this.authService.loadEmployeeSales(this.date);
    this.buildEmployeeChart();
  }

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

  buildHourlyChart() {
    if (!this.hourlyChartRef || !this.sales?.hourly?.length) return;

    const labels = this.sales.hourly.map((h: any) =>
      this.formatHour(h.hour)
    );

    const data = this.sales.hourly.map((h: any) => Number(h.total));

    this.hourlyChart?.destroy();

    this.hourlyChart = new Chart(this.hourlyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Hourly Sales',
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }


  buildEmployeeChart() {
    if (!this.employeeChartRef || !this.employeeSales?.length) return;

    const labels = this.employeeSales.map(e => e.employee);
    const data = this.employeeSales.map(e => Number(e.total));

    this.employeeChart?.destroy();

    this.employeeChart = new Chart(this.employeeChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Employee Sales',
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' // horizontal bar (better UX)
      }
    });
  }



  onTabChange(tab: any) {
    this.activeTab = tab.detail.value;

    setTimeout(() => {
      if (this.activeTab === 'sales') {
        this.buildHourlyChart();
      }
      if (this.activeTab === 'staff') {
        this.buildEmployeeChart();
      }
    }, 100); // allow DOM to render
  }

  formatHour(hour: number): string {
    const h = Number(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12} ${period}`;
  }


}

