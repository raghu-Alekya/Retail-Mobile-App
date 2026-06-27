import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PublicGuard  {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('wc_token');

    if (token) {
      return this.router.createUrlTree(['/home']);
    }

    return true;
  }

}
