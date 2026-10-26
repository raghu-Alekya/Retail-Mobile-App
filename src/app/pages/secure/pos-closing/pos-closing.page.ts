import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-pos-closing',
  templateUrl: './pos-closing.page.html',
  styleUrls: ['./pos-closing.page.scss'],
})
export class PosClosingPage implements OnInit {

  loading = false;
  isFilterModalOpen = false;

  filterType: 'date' | 'range' = 'date';

  selectedDate = '';
  fromDate = '';
  toDate = '';
  isDetailsModalOpen = false;

  selectedDateText = '';
  isCustomFilterApplied = false;
merchantName: string = '';
salesDetails: any[] = [];
showCalendar = false;
showFromCalendar = false;
showToCalendar = false;
  posClosingData: any = {
    total_orders: 0,
    total_orders_amount: 0,
    cancelled_orders: 0,
    refunded_orders_amount: 0,
    payouts: 0,
    void_items: 0,
    cash: 0,
    card: 0,
    ebt: 0
  };

  

  constructor(
  private navCtrl: NavController,
  private authService: AuthService
) {}

goHome() {
  this.navCtrl.navigateRoot('/tabs/home');
}

  ngOnInit() {

    console.log(this.salesDetails);

  const today = new Date();
  const todayStr = this.formatDate(today);

  // Popup default values
  this.selectedDate = todayStr;
  this.fromDate = todayStr;
  this.toDate = todayStr;

  // Card text
  this.selectedDateText = todayStr;

  this.isCustomFilterApplied = false;

  // API loads only today's data
  this.loadPosClosing(todayStr, todayStr);
}

onDateSelected(event: any) {
  const value = event.detail.value;

  if (value) {
    this.selectedDate = value.substring(0, 10); // yyyy-MM-dd
  }

  this.showCalendar = false;
}

closeFilterModal() {
  this.isFilterModalOpen = false;
  this.showCalendar = false;
  this.showFromCalendar = false;
  this.showToCalendar = false;
}

onFromDateSelected(event: any) {
  const value = event.detail.value;

  if (value) {
    this.fromDate = value.substring(0, 10);
  }

  this.showFromCalendar = false;
}

onToDateSelected(event: any) {
  const value = event.detail.value;

  if (value) {
    this.toDate = value.substring(0, 10);
  }

  this.showToCalendar = false;
}

async clearFilter(event?: Event) {

  event?.stopPropagation();

  const today = new Date();
  const todayStr = this.formatDate(today);

  // Reset popup values
  this.selectedDate = todayStr;
  this.fromDate = todayStr;
  this.toDate = todayStr;

  // Reset card text
  this.selectedDateText = todayStr;

  // Default tab
  this.filterType = 'date';

  // Load today's data
  await this.loadPosClosing(todayStr, todayStr);

  // Hide cross icon
  this.isCustomFilterApplied = false;
}

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  get absPayouts(): number {
  return Math.abs(this.posClosingData?.payouts || 0);
}

  openDateFilter() {
  this.isFilterModalOpen = true;
  this.showCalendar = false; // Hide calendar initially

  if (this.selectedDate) {
    this.filterType = 'date';
  } else if (this.fromDate || this.toDate) {
    this.filterType = 'range';
  }
}

  async applyFilter() {

  let startDate = '';
  let endDate = '';

  if (this.filterType === 'date') {

    if (!this.selectedDate) {
      alert('Please select a date');
      return;
    }

    startDate = this.selectedDate;
    endDate = this.selectedDate;

    this.selectedDateText = this.selectedDate;

    this.fromDate = '';
    this.toDate = '';

  } else {

    if (!this.fromDate || !this.toDate) {
      alert('Please select both dates');
      return;
    }

    // Validate date range
    if (new Date(this.fromDate) > new Date(this.toDate)) {
      alert('Please select a valid date range. "From Date" cannot be later than "To Date".');
      return;
    }

    startDate = this.fromDate;
    endDate = this.toDate;

    this.selectedDateText = `${this.fromDate} - ${this.toDate}`;

    this.selectedDate = '';
  }

  await this.loadPosClosing(startDate, endDate);

  this.isCustomFilterApplied = true;
  this.isFilterModalOpen = false;
}

  async loadPosClosing(startDate: string, endDate: string) {

    this.loading = true;

    try {

      const response = await this.authService.getPosClosing(startDate, endDate);

      console.log(response);

      if (response.success) {

        this.posClosingData = response.data;
         // Get merchant name from API
         this.merchantName = response.data.business_name || '';

        this.salesDetails = [
        {
          items: response.data.categories.map((category: any) => ({
            name: category.name,
            net: category.total_sales,
            percent: category.sales_percentage + '%'
          })),
          subtotal: response.data.category_subtotal,
          subtotalPercentage: response.data.category_percentage_total
        }
      ];

      }

    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  testDate(event: any) {
  console.log('EVENT:', event);
  console.log('VALUE:', event.target.value);
}
}