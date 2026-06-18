import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
  async scan(): Promise<string | null> {
    console.warn('Barcode scanner temporarily disabled');
    return null;
  }
}