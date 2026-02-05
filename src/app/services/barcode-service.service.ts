import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';

@Injectable({ providedIn: 'root' })
export class BarcodeService {

  constructor(private barcodeScanner: BarcodeScanner) {}

  async scan(): Promise<string | null> {
    try {
      const data = await this.barcodeScanner.scan({
        preferFrontCamera: false,
        showFlipCameraButton: true,
        showTorchButton: true,
        torchOn: false,
        prompt: 'Scan product barcode',
        resultDisplayDuration: 0,      // ✅ IMPORTANT
        disableSuccessBeep: false,
        orientation: 'portrait',
        formats: 'EAN_13,EAN_8,UPC_A,UPC_E,CODE_128,CODE_39'
      });

      if (!data.cancelled && data.text) {
        return data.text;
      }

      return null;

    } catch (err) {
      console.error('Barcode scan failed', err);
      return null;
    }
  }
}
