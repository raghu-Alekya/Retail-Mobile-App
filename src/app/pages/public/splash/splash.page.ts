import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

  taglines: string[] = [
    'Complete Store Management',
    'Control Your Store Anywhere',
    'Manage. Monitor. Grow.',
    'Powering Smart Merchants'
  ];

  currentTagline: string = '';

  constructor(private router: Router) {}

  ngOnInit() {

    // Get previous index
    let index = Number(localStorage.getItem('taglineIndex')) || 0;

    // Set current tagline
    this.currentTagline = this.taglines[index];

    // Increment index
    let nextIndex = (index + 1) % this.taglines.length;

    // Save for next time
    localStorage.setItem('taglineIndex', nextIndex.toString());

    // Navigate after animation

  setTimeout(() => {
    const token = localStorage.getItem('wc_token');

    if (token) {
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/welcome', { replaceUrl: true });
    }
  }, 2000); // splash delay
    }

  }

