import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Injectable({
  providedIn: 'root'
})
export class BarcodeServiceService {

  async scanBarcode(): Promise<string | null> {
    try {
      const support = await BarcodeScanner.isSupported();
      if (!support.supported) {
        throw new Error('Barcode scanning is not supported on this device');
      }

      // Install Google scanner module on Android only when missing.
      const moduleAvailability = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!moduleAvailability.available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      }

      // STEP 2: Request permission
      const permission = await BarcodeScanner.requestPermissions();

      if (permission.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }

      // STEP 3: Start scan
      const result = await BarcodeScanner.scan();

      if (result.barcodes.length > 0) {
        return result.barcodes[0].rawValue || null;
      }

      return null;

    } catch (error) {
      console.error('Barcode scanning error:', error);
      throw error;
    }
  }

  // Optional: Method to check permissions separately
  async checkPermissions() {
    return await BarcodeScanner.checkPermissions();
  }

  // Optional: Method to request permissions
  async requestPermissions() {
    return await BarcodeScanner.requestPermissions();
  }

  // Optional: Method to stop scanning if needed
  async stopScan() {
    await BarcodeScanner.stopScan();
  }
}