import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
@Component({ selector: 'app-root', templateUrl: 'app.component.html', styleUrls: ['app.component.scss'], standalone: false })
export class AppComponent {
  constructor(private platform: Platform) { void this.initializeApp(); }
  async initializeApp() {
    try { await this.platform.ready(); }
    finally {
      if (Capacitor.isNativePlatform()) {
        try { await SplashScreen.hide(); }
        catch (error) { console.warn('Unable to hide native splash', error); }
      }
    }
  }
}
