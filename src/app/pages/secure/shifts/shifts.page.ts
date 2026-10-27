import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';


@Component({
    selector: 'app-shifts',
    templateUrl: './shifts.page.html',
    styleUrls: ['./shifts.page.scss'],
    standalone: false
})
export class ShiftsPage implements OnInit {

filteredShifts: any[] = [];
  shifts: any[] = [];   
  loading = false;
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

 async loadShifts(event?: any) {

  this.loading = true;

  try {

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

}
