import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-splash', templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'], standalone: false
})
export class SplashPage implements OnInit, OnDestroy {
  taglines = ['Complete Store Management', 'Control Your Store Anywhere', 'Manage. Monitor. Grow.', 'Powering Smart Merchants'];
  currentTagline = '';
  private navigationTimer: ReturnType<typeof setTimeout>;
  constructor(private router: Router, private auth: AuthService) {}
  ngOnInit() {
    const saved = Number(localStorage.getItem('taglineIndex'));
    const index = Number.isInteger(saved) && saved >= 0 ? saved % this.taglines.length : 0;
    this.currentTagline = this.taglines[index];
    localStorage.setItem('taglineIndex', String((index + 1) % this.taglines.length));
    this.navigationTimer = setTimeout(() => void this.openApp(), 1500);
  }
  private async openApp() {
    try {
      if (this.auth.hasUsableSession()) {
        if (await this.router.navigateByUrl('/tabs/home', { replaceUrl: true })) return;
      }
    } catch (error) { console.error('Startup navigation failed', error); }
    this.auth.logout();
    await this.router.navigateByUrl('/signin', { replaceUrl: true });
  }
  ngOnDestroy() { clearTimeout(this.navigationTimer); }
}
