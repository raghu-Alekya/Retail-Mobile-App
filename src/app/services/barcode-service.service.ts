import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {

  async scan(): Promise<string | null> {
    try {

      const permissions =
        await BarcodeScanner.requestPermissions();

      if (permissions.camera !== 'granted') {
        return null;
      }

      const result = await BarcodeScanner.scan();

      if (result.barcodes.length > 0) {
        return result.barcodes[0].rawValue || null;
      }

      return null;

    } catch (error) {
      console.error('Barcode scan failed', error);
      return null;
    }
  }
}