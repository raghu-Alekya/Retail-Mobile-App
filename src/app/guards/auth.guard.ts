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

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('wc_token');

    if (!token) {
      return this.router.createUrlTree(['/welcome']);
    }

    return true;
  }
}
