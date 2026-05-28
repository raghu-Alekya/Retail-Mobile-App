import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Http } from '@capacitor-community/http';
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

  /** Call Assets API (Native HTTP - iOS safe) */
  async loadAssets(): Promise<any> {

    const token = localStorage.getItem('wc_token');
    if (!token) throw new Error('Auth token not found');

    const baseUrl = this.apiConfig.getBaseUrl();
    const url = `${baseUrl}/wp-json/pinaka-pos/v1/assets`;

    console.log("🔥 LOADING ASSETS (NATIVE HTTP)");

    const res = await Http.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    // some servers return string JSON
    const data =
      typeof res.data === 'string'
        ? JSON.parse(res.data)
        : res.data;

    localStorage.setItem('app_assets', JSON.stringify(data));
    this.assetsSubject.next(data);

    return data;
  }

  /** Clear assets on logout */
  clearAssets() {
    localStorage.removeItem('app_assets');
    this.assetsSubject.next(null);
  }

  /* ======================
     Quick Getters
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
