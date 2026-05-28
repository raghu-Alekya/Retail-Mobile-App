// import { Injectable } from '@angular/core';
// import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';

// @Injectable({ providedIn: 'root' })
// export class BarcodeService {

//   constructor(private barcodeScanner: BarcodeScanner) {}

//   async scan(): Promise<string | null> {
//     const data = await this.barcodeScanner.scan({
//       preferFrontCamera: false,
//       showFlipCameraButton: true,
//       showTorchButton: true,
//       prompt: 'Scan product barcode',
//       formats: 'EAN_13,EAN_8,UPC_A,UPC_E,CODE_128,QR_CODE',
//     });

//     if (!data.cancelled) {
//       return data.text;
//     }

//     return null;
//   }
// }

import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {

  async scan(): Promise<string | null> {
    try {

      const status = await BarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        return null;
      }

      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan();

console.log('SCAN RESULT:', result);

      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();

      if (result.hasContent) {
        return result.content;
      }

      return null;

    } catch (error) {
      console.error('Barcode scan failed', error);
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
      return null;
    }
  }
}