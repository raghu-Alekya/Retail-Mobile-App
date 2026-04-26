import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  async scan(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    await BarcodeScanner.prepare();

    const status = await BarcodeScanner.checkPermission({ force: true });
    if (!status.granted) {
      return null;
    }

    BarcodeScanner.hideBackground();
    document.body.classList.add('scanner-active');

    try {
      const result = await BarcodeScanner.startScan();
      return (result?.content || '').trim() || null;
    } finally {
      await BarcodeScanner.stopScan();
      BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');
    }
  }
}
