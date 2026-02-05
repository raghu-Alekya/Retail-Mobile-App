import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import axios from 'axios';
import { environment } from 'src/environments/environment';
import { ApiConfigService } from '../api-config.service';

@Injectable({ providedIn: 'root' })
export class AssetsService {

  private assetsSubject = new BehaviorSubject<any | null>(null);
  public assets$ = this.assetsSubject.asObservable();

  constructor(private apiConfig: ApiConfigService) {
    this.loadAssetsFromStorage();
  }

  /** Load cached assets on app refresh */
  private loadAssetsFromStorage() {
    const cached = localStorage.getItem('app_assets');
    if (cached) {
      this.assetsSubject.next(JSON.parse(cached));
    }
  }

  /** Call Assets API */
  async loadAssets(): Promise<any> {
    const token = localStorage.getItem('wc_token');
    if (!token) throw new Error('Auth token not found');

    const baseUrl = this.apiConfig.getBaseUrl();

    const res = await axios.get(
      `${baseUrl}/wp-json/pinaka-pos/v1/assets`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    localStorage.setItem('app_assets', JSON.stringify(res.data));
    this.assetsSubject.next(res.data);

    return res.data;
  }

  /** Clear assets on logout */
  clearAssets() {
    localStorage.removeItem('app_assets');
    this.assetsSubject.next(null);
  }
  /* ======================
     Quick Getters (Optional)
     ====================== */

  get currency() {
    return this.assetsSubject.value?.currency;
  }

  get currencySymbol() {
    return this.assetsSubject.value?.currency_symbol;
  }

  get employees() {
    return this.assetsSubject.value?.employees || [];
  }

  get coupons() {
    return this.assetsSubject.value?.coupons || [];
  }

  get vendors() {
    return this.assetsSubject.value?.vendors || [];
  }

}
