import { Component } from '@angular/core';

@Component({
    selector: 'app-address',
    templateUrl: './address.page.html',
    styleUrls: ['./address.page.scss'],
    standalone: false
})
export class AddressPage {

  newAddress: string = '';
  savedAddress: string = '';   // empty = no saved address
  isEditing: boolean = false;  // 👈 add this

  startAdd() {
    this.isEditing = true;
  }

  addAddress() {
    if (this.newAddress && this.newAddress.trim() !== '') {
      this.savedAddress = this.newAddress;
      this.newAddress = '';
      this.isEditing = false;   // close form after save
    }
  }

}
