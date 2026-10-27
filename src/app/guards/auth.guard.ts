import { Injectable } from '@angular/core';

import { ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { LogoutPopupComponent } from '../logout-popup/logout-popup.component';
@Injectable({
  providedIn: 'root',
})
export class AuthGuard  {

  private popupShown = false;

  constructor(
    private authService: AuthService,
    private modalController: ModalController,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    
    const token = localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!).token : null;

    if (!token || token === 'undefined' || token === 'null') {

      await this.showLogoutPopup();

        return false;
    }

    try {

      const res: any = await this.authService.validateuser(token);
      if (
        res?.valid === 'false' ||
        res?.valid === false ||
        res?.valid === '0' ||
        res?.valid === 0
      ) {
    
        await this.showLogoutPopup();

        return false;
      }

      // TOKEN VALID
      if (res?.valid) {
        return true;
      }

      return true;

    } catch (error: any) {
     
      await this.showLogoutPopup();
      return false;
    }
  }

  async showLogoutPopup() {

    if (this.popupShown) {
      return;
    }

    this.popupShown = true;

    let countdown = 5;

    const modal = await this.modalController.create({
      component: LogoutPopupComponent,
      cssClass: 'logout-modal',
      backdropDismiss: false,
      showBackdrop: true
    });

    await modal.present();

    const interval = setInterval(() => {

      countdown--;

      const countdownEl = document.getElementById('countdown');

      if (countdownEl) {
        countdownEl.innerText = countdown.toString();
      }

      if (countdown === 0) {

        clearInterval(interval);

        modal.dismiss();

        localStorage.clear();
        sessionStorage.clear();

        this.popupShown = false;

        this.router.navigateByUrl('/signin', {
          replaceUrl: true
        });
      }

    }, 1000);
  }
}