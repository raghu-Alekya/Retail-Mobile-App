import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {

    const token = localStorage.getItem('wc_token');

    if (!token || token === 'undefined' || token === 'null') {
      return this.router.createUrlTree(['/welcome']);
    }

    try {
      const res = await this.authService.validateToken(token);

      if (res?.valid) {
        return true;
      }

      localStorage.clear();
      return this.router.createUrlTree(['/welcome']);

    } catch {
      localStorage.clear();
      return this.router.createUrlTree(['/welcome']);
    }
  }
}