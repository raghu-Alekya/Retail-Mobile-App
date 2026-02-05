import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.page.html',
  styleUrls: ['./shifts.page.scss'],
})
export class ShiftsPage implements OnInit {

  shifts: any[] = [];
  page = 1;
  limit = 10;          // optional, if API supports it
  loading = false;
  hasMore = true;
  search = '';         // optional (staff name, etc.)
  status = '';         // open / closed filter
  isLoading = false;

  constructor(
    private toastCtrl: ToastController,     
    private authService: AuthService,
  ) {}

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

      if (event) {
        event.target.disabled = false;
      }
    }

    this.loading = true;

    try {
      const res = await this.authService.getShifts(
        this.page,
        this.search,
        this.status
      );

      console.log('Shifts API response:', res);

      // ✅ FIX STARTS HERE
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        this.shifts.push(...res.data);
        this.page++;
        this.hasMore = res.pagination?.has_more ?? false;
      } else {
        this.hasMore = false;
        if (event) {
          event.target.disabled = true;
        }
      }
      // ✅ FIX ENDS HERE

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

  onSearch(event: any) {
    this.search = event.target.value?.trim() || '';

    // reset pagination + data
    this.loadShifts(undefined, true);
  }


}
