import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.page.html',
  styleUrls: ['./products-list.page.scss']
})
export class ProductsListPage implements OnInit {

  products: any[] = [];
  page = 1;
  search = '';
  searchTerm: string = '';
  stock = ''; 
  loading = false;
  hasMore = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Add this
  ) {}

  ngOnInit() {
    this.loadProducts();
    
    // Listen for query params if you're passing refresh flag
    this.route.queryParams.subscribe(params => {
      if (params['refresh'] === 'true') {
        this.loadProducts(undefined, true);
      }
    });
  }
stockFilter = 'all';

setStockFilter(value: string){
  this.stockFilter = value;
  this.onStockFilter({ detail: { value } });
}
  // This runs every time the page is about to enter
  ionViewWillEnter() {
  this.loadProducts(undefined, true);
}

  async loadProducts(event?: any, reset = false) {
    if (reset) {
      this.page = 1;
      this.products = [];
      this.hasMore = true;
      
      // Reset infinite scroll
      if (event) {
        event.target.disabled = false;
      }
    }

    if (this.loading || (!reset && !this.hasMore)) {
      event?.target.complete();
      return;
    }

    this.loading = true;

    try {
      const data = await this.authService.getProducts(
        this.page,
        this.search,
        this.stock
      );

      if (Array.isArray(data) && data.length > 0) {
        this.products = reset ? data : [...this.products, ...data];
        this.page++;
        this.hasMore = data.length === 10; // Assuming 10 per page
      } else {
        this.hasMore = false;
      }
    } catch (e) {
      console.error(e);
    }

    this.loading = false;
    
    if (event) {
      event.target.complete();
      
      // Disable infinite scroll if no more data
      if (!this.hasMore) {
        event.target.disabled = true;
      }
    }
  }

  onSearchChange() {
    this.onSearch(this.searchTerm);
  }

  // Add pull-to-refresh
  async handleRefresh(event: any) {
    await this.loadProducts(event, true);
    event.target.complete();
  }

  searchTimeout: any;

  onSearch(value: string) {

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.search = value?.trim() || '';
      this.loadProducts(undefined, true);
    }, 400);
  }
  
  onStockFilter(event: any) {
    this.stock = event.detail.value === 'all'
      ? ''
      : event.detail.value;

    this.loadProducts(undefined, true);
  }

  trackById(_: number, item: any) {
    return item.id;
  }

  openProductDetails(productId: number) {
    this.router.navigate(['/products/edit', productId]);
  }
}