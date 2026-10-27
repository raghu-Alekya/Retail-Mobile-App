import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PosClosingPage } from './pos-closing.page';

describe('PosClosingPage', () => {
  let component: PosClosingPage;
  let fixture: ComponentFixture<PosClosingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PosClosingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
