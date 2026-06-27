import { Injectable } from '@angular/core';

import { AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthGuard  {

  private popupShown = false;

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const currentUrl = this.router.url;
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

    const alert = await this.alertController.create({
      cssClass: 'custom-logout-alert',
      backdropDismiss: false,

      message: `
        <div class="logout-popup">

          <img src="../../assets/session-logout.png" class="logout-img" />

          <div class="logout-title">
            You've been logged out
          </div>

          <div class="logout-message">
            Your account was logged in from another device.
            For security reasons your session has ended.
          </div>

          <div class="logout-countdown">
            Redirecting in <span id="countdown">${countdown}</span>
          </div>

        </div>
      `
    });

    await alert.present();

    const interval = setInterval(() => {

      countdown--;

      const countdownEl = document.getElementById('countdown');

      if (countdownEl) {
        countdownEl.innerText = countdown.toString();
      }

      if (countdown === 0) {

        clearInterval(interval);

        alert.dismiss();

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