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
  loadError = '';
  private reportRows: any[] = [];
  private loadRequestId = 0;
  private loadingStoreId = '';
  private pendingLoad: Promise<void> | null = null;
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
detailsError = '';
private detailsRequestId = 0;
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
    const requestId = ++this.detailsRequestId;
    this.selectedShift = shift;
    this.shiftDetails = [];
    this.filteredShiftDetails = [];
    this.detailsError = '';
    this.detailsLoading = true;
    this.isDetailsModalOpen = true;
    try {
      const rows = await this.authService.getShiftDetailsByDate(shift.date, this.loadingStoreId);
      if (requestId !== this.detailsRequestId) return;
      this.shiftDetails = rows;
      this.filteredShiftDetails = [...rows];
    } catch (error: any) {
      if (requestId === this.detailsRequestId) this.detailsError = error?.message || 'Unable to load shift details.';
    } finally {
      if (requestId === this.detailsRequestId) this.detailsLoading = false;
    }
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
  ++this.detailsRequestId;
  this.detailsLoading = false;
  this.detailsError = '';
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
   * Load daily summaries for the selected dashboard store
   */

  ionViewWillEnter() { void this.loadShifts(); }

  async loadShifts(event?: any) {
    let storeId = '';
    try { storeId = JSON.parse(localStorage.getItem('selected_store') || 'null')?.id || ''; } catch {}
    if (this.pendingLoad && this.loadingStoreId === storeId) {
      try { await this.pendingLoad; } finally { event?.target?.complete(); }
      return;
    }
    const requestId = ++this.loadRequestId;
    this.loadingStoreId = storeId;
    this.loading = true;
    this.loadError = '';
    this.shifts = [];
    this.filteredShifts = [];
    this.reportRows = [];
    this.closeShiftDetails();
    this.pendingLoad = (async () => {
      try {
        const rows = await this.authService.getPchDailyShiftSummary(storeId);
        if (requestId !== this.loadRequestId) return;
        this.shifts = rows.map(row => ({ ...row, date: String(row.date || '').slice(0, 10), employee_names: [] }))
          .sort((a, b) => b.date.localeCompare(a.date));
        this.filterShifts();
      } catch (error: any) {
        if (requestId === this.loadRequestId) this.loadError = error?.message || 'Unable to load shifts. Please try again.';
      } finally {
        if (requestId === this.loadRequestId) { this.loading = false; this.pendingLoad = null; }
      }
    })();
    try { await this.pendingLoad; } finally { event?.target?.complete(); }
  }

  private filterShifts() {
    const search = this.search.trim().toLowerCase();
    this.filteredShifts = this.shifts.filter(shift =>
      (!this.fromDateApi || shift.date >= this.fromDateApi) && (!this.toDateApi || shift.date <= this.toDateApi) &&
      (!search || shift.date.includes(search) || shift.employee_names.some((name: string) => name.toLowerCase().includes(search))));
  }

  onSearch(event: any) {
    this.search = String(event.target.value || '');
    this.filterShifts();
  }

  closeCalendar() { this.calendarMode = null; }

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

  this.filterShifts();
}

async clearDateFilter() {

  this.fromDateApi = '';
  this.toDateApi = '';

  this.fromDateValue = '';
  this.toDateValue = '';

  this.selectedDateText = '';

  this.filterType = '';
  this.filterShifts();
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
