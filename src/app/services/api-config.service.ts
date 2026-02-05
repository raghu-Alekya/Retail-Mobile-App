import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {

  private readonly KEY = 'wp_base_url';

  setBaseUrl(siteUrl: string) {
    let url = siteUrl.trim();

    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    localStorage.setItem(this.KEY, url);
  }

  getBaseUrl(): string {
    const url = localStorage.getItem(this.KEY);
    if (!url) {
      throw new Error('Base URL not set');
    }
    return url;
  }

  clear() {
    localStorage.removeItem(this.KEY);
  }
}
