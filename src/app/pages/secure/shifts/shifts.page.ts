import { Component, OnInit } from '@angular/core';
import { IonicModule,NavController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.page.html',
  styleUrls: ['./shifts.page.scss'],
})
export class ShiftsPage implements OnInit {

filteredShifts: any[] = [];

colors = ['yellow', 'red', 'teal', 'orange', 'purple'];





  shifts: any[] = [];
  page = 1;
  limit = 10;          // optional, if API supports it
  loading = false;
  hasMore = true;
  search = '';         // optional (staff name, etc.)
  status = '';         // open / closed filter
  isLoading = false;

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

  /**
   * Pull to refresh
   */
  refresh(event: any) {
    this.loadShifts(event);
  }

  /**
   * Status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'medium';
      default:
        return 'warning';
    }
  }

  /**
   * Over / Short color
   */
  getOverShortColor(amount: number): string {
    if (amount < 0) return 'danger';
    if (amount > 0) return 'success';
    return 'medium';
  }

  /**
   * Format date safely
   */
  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  }

  /**
   * Calculate total safe drop amount
   */
  getSafeDropTotal(shift: any): number {
    if (!shift.safe_drops?.length) return 0;
    return shift.safe_drops.reduce(
      (sum: number, d: any) => sum + Number(d.total),
      0
    );
  }
getBorderColor(index: number) {
  return this.colors[index % this.colors.length];
}

getAvatarColor(index: number) {
  return `${this.colors[index % this.colors.length]}-bg`;
}

  /**
   * Calculate total vendor payouts
   */
  getVendorTotal(shift: any): number {
    if (!shift.vendor_payouts?.length) return 0;
    return shift.vendor_payouts.reduce(
      (sum: number, v: any) => sum + Number(v.amount),
      0
    );
  }

  /**
   * TrackBy for performance
   */
  trackByShiftId(index: number, shift: any) {
    return shift.shift_id;
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

 async loadShifts(event?: any, reset = false) {

  if (this.loading || !this.hasMore) {
    event?.target.complete();
    return;
  }

  if (reset) {
    this.page = 1;
    this.shifts = [];
    this.hasMore = true;
  }

  this.loading = true;

  try {
    const res = await this.authService.getShifts(
      this.page,
      '',   // ❌ remove search from API
      this.status
    );

    console.log('Shifts API response:', res);

    if (res?.data?.length) {

      const mapped = res.data.map((s: any) => this.mapShift(s));

      this.shifts.push(...mapped);
      if (this.search) {
        this.filteredShifts = this.shifts.filter(shift =>
          shift.staffName?.toLowerCase().trim().startsWith(this.search)
        );
      } else {
        this.filteredShifts = [...this.shifts];
      }

      this.page++;   // ✅ load next page next time
      this.hasMore = res.pagination?.has_more ?? false;

    } else {
      this.hasMore = false;
    }

  } catch (err) {
    console.error('Shift load failed', err);
  }

  this.loading = false;
  event?.target.complete();
}

  getMockShifts() {
    
    return [
      {
        shift_id: 25735,
        user_name: 'swapna boyapati',
        start_time: '2025-12-26 09:59:12',
        end_time: '',
        total_sales: 20,
        total_sale_amount: 3158.34,
        safe_drop_total: 8800,
        safe_drops: [
          {
            id: 25761,
            total: 8800,
            time: '2025-12-26 10:17:55',
          },
        ],
        vendor_payouts: [
          {
            amount: 0.12,
            vendor_name: 'bubba vendor 1',
            payment_method: 'Check',
            time: '2025-12-26 10:17:36',
          },
        ],
        total_vendor_payments: 0.12,
        shift_status: 'open',
        over_short: 0,
      },
    ];
  }

  // onSearch(event: any) {
  //   this.search = event.target.value?.trim() || '';

  //   // reset pagination + data
  //   this.loadShifts(undefined, true);
  // }
  onSearch(event: any) {
  const value = event.target.value?.toLowerCase().trim() || '';

  this.search = value;

  if (!value) {
    this.filteredShifts = [...this.shifts];
    return;
  }

  this.filteredShifts = this.shifts.filter(shift =>
    shift.staffName?.toLowerCase().trim().startsWith(value)
  );
}


mapShift(apiShift: any) {

  return {
    staffName: apiShift.user_name,
    date: apiShift.start_time,

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

}
