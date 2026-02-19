import { Component, ViewChild, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { SwiperComponent } from 'swiper/angular';
import SwiperCore, { Pagination, SwiperOptions } from 'swiper';

SwiperCore.use([Pagination]);

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class WelcomePage {

  language: string = '';
  last_slide: boolean = false;
  currentIndex: number = 0;

  @ViewChild('swiper', { static: false }) swiper!: SwiperComponent;

  // Swiper config
  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 50,
    allowTouchMove: true,
    preventClicks: false,
    preventClicksPropagation: false,
    pagination: {
      clickable: true
    }
  };

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  nextSlide() {
    this.swiper?.swiperRef.slideNext();
  }

  goToLastSlide() {
    this.swiper?.swiperRef.slideTo(2);
  }

  onSlideChange() {
    if (this.swiper?.swiperRef) {
      this.currentIndex = this.swiper.swiperRef.activeIndex;
      this.cd.detectChanges();
    }
  }

  onLastSlide() {
    this.last_slide = true;
  }

  goToSignIn() {
    this.router.navigate(['/signin']);
  }
}
