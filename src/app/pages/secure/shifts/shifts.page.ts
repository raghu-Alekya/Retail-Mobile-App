import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.page.html',
  styleUrls: ['./shifts.page.scss'],
})
export class ShiftsPage implements OnInit {

filteredShifts: any[] = [];
  shifts: any[] = [];   
  loading = false;
<<<<<<< Updated upstream
  hasMore = true;
  search = '';         // optional (staff name, etc.)
  status = '';         // open / closed filter
  isLoading = false;
=======
  search = '';         // optional (staff name, etc.)      // open / closed filter

  fromDateApi = '';
toDateApi = '';

showDateModal = false;

fromDateValue = '';
toDateValue = '';

selectedDateText = '';

dateFilterTab: 'date' | 'range' = 'date';

calendarMode: 'single' | 'from' | 'to' | null = null;

filterType: 'date' | 'range' | '' = '';
maxDate = new Date().toISOString().split('T')[0];

selectedShift: any = null;
isDetailsModalOpen = false;
shiftDetails: any[] = [];
detailsLoading = false;
filteredShiftDetails: any[] = [];
>>>>>>> Stashed changes

  constructor(
  private navCtrl: NavController,
  private router: Router,
  private toastCtrl: ToastController,
  private authService: AuthService
) {}

goBack() {
  if (this.router.url.includes('/shifts')) {
    // 🔥 explicit fallback
    this.navCtrl.navigateRoot('/tabs/home');
  } else {
    this.navCtrl.back();
  }
}

  ngOnInit() {
    this.loadShifts();
  }

  async openShiftDetails(shift: any) {

  this.detailsLoading = true;

  try {

    const date = shift.date; // Example: 2026-07-22

    const res = await this.authService.getShiftDetails(date);

    if (res.success) {
      this.shiftDetails = res.data;
  this.filteredShiftDetails = [...this.shiftDetails];
  this.isDetailsModalOpen = true;
    } else {
      this.shiftDetails = [];
  this.filteredShiftDetails = [];
    }

  } catch (e) {
    console.error(e);
  }

  this.detailsLoading = false;
}

onShiftDetailsSearch(event: any) {

  const value = (event.target.value || '').trim().toLowerCase();

  if (!value) {
    this.filteredShiftDetails = [...this.shiftDetails];
    return;
  }

  this.filteredShiftDetails = this.shiftDetails.filter((shift: any) =>
    shift.user_name?.toLowerCase().includes(value)
  );

}

closeShiftDetails() {
  this.isDetailsModalOpen = false;
  this.shiftDetails = [];
  this.filteredShiftDetails = [];
}

getThemeClass(index: number): string {

  const themes = [
    'theme-green',
    'theme-blue',
    'theme-red',
    'theme-yellow'
  ];

  return themes[index % themes.length];

}
  /**
   * Pull to refresh
   */
  refresh(event: any) {
    this.loadShifts(event);
  }


  /**
   * Toast helper
   */
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }

  /**
   * Mock data – remove after API integration
   */

<<<<<<< Updated upstream
 async loadShifts(event?: any, reset = false) {

  if (this.loading || !this.hasMore) {
    event?.target.complete();
    return;
  }
=======
 async loadShifts(event?: any) {
>>>>>>> Stashed changes

  if (reset) {
    this.page = 1;
    this.shifts = [];
    this.hasMore = true;
  }

  this.loading = true;

  try {
<<<<<<< Updated upstream
    const res = await this.authService.getShifts(
      this.page,
      '',   // ❌ remove search from API
      this.status
    );
=======
>>>>>>> Stashed changes

    const res = await this.authService.getDailyShiftSummary(
      this.fromDateApi,
      this.toDateApi
    );

    console.log("Daily Summary:", res);

    if (res?.success && Array.isArray(res.data)) {

  this.shifts = res.data;
  this.filteredShifts = [...this.shifts];

} else {

  this.shifts = [];
  this.filteredShifts = [];

}

  } catch (e) {

    console.error(e);

  }

  this.loading = false;
  event?.target.complete();

}

 

  onSearch(event: any) {

  const value = (event.target.value || '').toLowerCase();

  if (!value) {

    this.filteredShifts = [...this.shifts];
    return;

  }

  this.filteredShifts = this.shifts.filter((item: any) =>
    item.date?.toLowerCase().includes(value)
  );

}




<<<<<<< Updated upstream
    // ✅ use backend values directly
    openingBalance: Number(apiShift.opening_balance || 0),
    closingBalance: Number(apiShift.closing_balance || 0),

    sales: Number(apiShift.total_sale_amount || 0),
    overShort: Number(apiShift.over_short || 0),

    startTime: apiShift.start_time?.split(' ')[1] || '—',
    endTime: apiShift.end_time
      ? apiShift.end_time.split(' ')[1]
      : '—',

    duration: this.getDuration(
      apiShift.start_time,
      apiShift.end_time
    ),
  };
}
getDuration(start: string, end: string): string {
  if (!start || !end) return '-';

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs <= 0) return '-';

  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

formatCurrency(value: number): string {
  if (value < 0) {
    return `-$${Math.abs(value)}`;
  }
  return `$${value}`;
}
// openShift(shift: any) {
//   console.log('Shift clicked:', shift);

//   // temporary test
//   this.showToast(`Opening shift: ${shift.staffName}`);
// }

=======

async applyDateFilter() {

  // Range validation & auto swap
  if (
    this.dateFilterTab === 'range' &&
    this.fromDateValue &&
    this.toDateValue &&
    new Date(this.fromDateValue) > new Date(this.toDateValue)
  ) {
    const temp = this.fromDateValue;
    this.fromDateValue = this.toDateValue;
    this.toDateValue = temp;
  }

  // Mandatory From Date
  if (!this.fromDateValue) {
    return;
  }

  // Single Date Filter
  if (this.dateFilterTab === 'date') {

    this.filterType = 'date';

    this.fromDateApi = this.fromDateValue.split('T')[0];
    this.toDateApi = this.fromDateApi;

    this.selectedDateText = this.fromDateApi;

  }

  // Date Range Filter
  else {

    if (!this.toDateValue) {
      return;
    }

    this.filterType = 'range';

    this.fromDateApi = this.fromDateValue.split('T')[0];
    this.toDateApi = this.toDateValue.split('T')[0];

    this.selectedDateText =
      `${this.fromDateApi} - ${this.toDateApi}`;
  }

  this.showDateModal = false;
  this.calendarMode = null;

  await this.loadShifts();
}

async clearDateFilter() {

  this.fromDateApi = '';
  this.toDateApi = '';

  this.fromDateValue = '';
  this.toDateValue = '';

  this.selectedDateText = '';

  this.filterType = '';
  this.shifts = [];
  this.filteredShifts = [];

  await this.loadShifts();
}

switchToDateTab() {
  this.dateFilterTab = 'date';
}

switchToRangeTab() {
  this.dateFilterTab = 'range';
}

openSingleDate() {
  this.calendarMode = 'single';
}

openFromDate() {
  this.calendarMode = 'from';
}

openToDate() {
  this.calendarMode = 'to';
}

resetDateModal() {
  this.calendarMode = null;
  this.showDateModal = false;
}

onToDateChange() {
  //this.calendarMode = null;
  if (
    this.fromDateValue &&
    this.toDateValue &&
    new Date(this.fromDateValue) > new Date(this.toDateValue)
  ) {

    const temp = this.fromDateValue;

    this.fromDateValue = this.toDateValue;

    this.toDateValue = temp;
  }
}

>>>>>>> Stashed changes
}
