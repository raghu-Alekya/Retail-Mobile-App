import { Component } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
 
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
isOpen = false;
 
toggle() {
  this.isOpen = !this.isOpen;
}

  hideTabBar: boolean = false;
 
  constructor(
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
    this.router.events.subscribe(() => {
 
  const url = this.router.url;
 
  this.hideTabBar =
    url.includes('/tabs/profile') ||
    url.includes('/tabs/edit-profile') ||
    url.startsWith('/tabs/address') ||
    url.startsWith('/tabs/change-password');
 
});
 
 
  }
  // Select action
  async selectAction() {

    const actionSheet = await this.actionSheetController.create({
      header: 'Choose an action',
      cssClass: 'custom-action-sheet',
      buttons: [
        {
          text: 'Add something',
          icon: 'wallet',
          handler: () => {
            // Put in logic ...
          }
        },
        {
          text: 'Change something',
          icon: 'swap-horizontal-outline',
          handler: () => {
            // Put in logic ...
          }
        },
        {
          text: 'Set something',
          icon: 'calculator',
          handler: () => {
            // Put in logic ...
          }
        }, {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }]
    });
    await actionSheet.present();
  }
  goToAddEmployee() {
    this.isOpen = false;
    this.router.navigate(['users/employees'], {
      state: {
        autoOpenCreate: true
      }
    });
  }

  goToAddProduct() {
    this.isOpen = false;
    this.router.navigate(['products/add']);
  }

  goToAddCoupon() {
    this.isOpen = false;
    this.router.navigate(['coupons'], {
      state: {
        autoOpenCreate: true
      }
    });
  }
}
