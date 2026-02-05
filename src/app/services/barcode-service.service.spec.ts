import { TestBed } from '@angular/core/testing';

import { BarcodeServiceService } from './barcode-service.service';

describe('BarcodeServiceService', () => {
  let service: BarcodeServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarcodeServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
