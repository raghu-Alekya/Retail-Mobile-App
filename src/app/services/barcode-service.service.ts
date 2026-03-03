import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';

@Injectable({ providedIn: 'root' })
export class BarcodeService {

  constructor(private barcodeScanner: BarcodeScanner) {}

  async scan(): Promise<string | null> {
    const data = await this.barcodeScanner.scan({
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      prompt: 'Scan product barcode',
      formats: 'EAN_13,EAN_8,UPC_A,UPC_E,CODE_128,QR_CODE',
    });

    if (!data.cancelled) {
      return data.text;
    }

    return null;
  }
}
