import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BarcodeService } from 'src/app/services/barcode-service.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.page.html',
  styleUrls: ['./product-form.page.scss'],
  imports: [IonicModule, CommonModule, RouterModule],
})
export class ProductFormPage implements OnInit {

  isEdit = false;
  productId!: number;
  imagePreview: string | null = null;
  selectedFile!: File;
  categories: any[] = [];
  tags: any[] = [];
  attributes: any[] = [];
  selectedAttributes: { [key: number]: string[] } = {};

  product: any = {
    name: '',
    description: '',
    short_description: '',
    type: 'simple',
    status: 'publish',
    regular_price: '',
    sale_price: '',
    sku: '',
    weight: '',
    featured: false,
    sold_individually: false,
    reviews_allowed: true,
  };

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private router: Router, 
    private barcodeService: BarcodeService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Load initial data
    await this.loadCategories();
    await this.loadTags();
    
    if (id) {
      this.isEdit = true;
      this.productId = +id;
      await this.loadProduct();
    }
    
    // Load attributes only after product type is known
    if (this.product.type === 'variable') {
      await this.loadAttributes();
    }
  }

  async loadProduct() {
    try {
      const res = await this.authService.getProductById(this.productId);

      this.product = {
        name: res.name,
        description: this.stripHtml(res.description),
        short_description: this.stripHtml(res.short_description),
        type: res.type,
        status: res.status,
        regular_price: res.regular_price,
        sale_price: res.sale_price,
        sku: res.sku,
        weight: res.weight,
        featured: res.featured,
        sold_individually: res.sold_individually,
        reviews_allowed: res.reviews_allowed,
        category_ids: res.categories?.map((c: any) => c.id) || [],
        tag_ids: res.tags?.map((t: any) => t.id) || [],
      };

      // Set image preview
      if (res.images && res.images.length > 0) {
        this.imagePreview = res.images[0].src;
      }

      // Load attributes for variable product
      if (res.type === 'variable') {
        await this.loadAttributes();
        
        // Set selected attributes if editing variable product
        if (res.attributes) {
          res.attributes.forEach((attr: any) => {
            if (attr.id && attr.options) {
              this.selectedAttributes[attr.id] = Array.isArray(attr.options) 
                ? attr.options 
                : [attr.options];
            }
          });
        }
      }

    } catch (e) {
      console.error('Failed to load product', e);
    }
  }

  async loadCategories() {
    const res = await this.authService.getCategories();
    this.categories = res;
  }

  async loadTags() {
    const res = await this.authService.getTags();
    this.tags = res;
  }

  async loadAttributes() {
    try {
      this.attributes = [];
      const attrs = await this.authService.getAttributes();
      
      for (const attr of attrs.data || attrs) {
        try {
          const terms = await this.authService.getAttributeTerms(attr.id);
          
          // Fix the terms data structure
          const termsArray = terms.data || terms || [];
          
          this.attributes.push({
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            terms: Array.isArray(termsArray) ? termsArray : []
          });
        } catch (error) {
          console.error(`Failed to load terms for attribute ${attr.id}`, error);
          this.attributes.push({
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            terms: []
          });
        }
      }
    } catch (error) {
      console.error('Failed to load attributes', error);
    }
  }

  async publishProduct() {
    try {
      const payload: any = {
        name: this.product.name,
        description: this.product.description,
        short_description: this.product.short_description,
        type: this.product.type,
        status: this.product.status,
        regular_price: this.product.regular_price,
        sale_price: this.product.sale_price || '',
        sku: this.product.sku,
        weight: this.product.weight,
        featured: this.product.featured,
        sold_individually: this.product.sold_individually,
        reviews_allowed: this.product.reviews_allowed,
      };

      if(this.product.name === '') {
        await this.showAlert(
          'Validation Error',
          'Product name is required',
          'danger'
        );
        return;
      } 

      if(this.categories.length === 0) {
        await this.showAlert(
          'Validation Error',
          'At least one category is required',
          'danger'
        );
        return;
      }

      // Add categories and tags
      if (this.product.category_ids?.length) {
        payload.categories = this.product.category_ids.map((id: number) => ({ id }));
      }

      if (this.product.tag_ids?.length) {
        payload.tags = this.product.tag_ids.map((id: number) => ({ id }));
      }

      // Upload image if new file selected
      if (this.selectedFile) {
        try {
          const media = await this.authService.uploadMedia(this.selectedFile);
          payload.images = [{ id: media.id }];
        } catch (error) {
          console.error('Failed to upload image', error);
        }
      } else if (this.imagePreview && this.imagePreview.startsWith('http')) {
        // Keep existing image if editing and no new file selected
        payload.images = [{ src: this.imagePreview }];
      }

      // Add attributes for variable product
      if (this.product.type === 'variable') {
        const attributes = [];
        
        for (const attrId in this.selectedAttributes) {
          if (this.selectedAttributes[attrId]?.length) {
            attributes.push({
              id: Number(attrId),
              name: this.getAttributeName(Number(attrId)),
              variation: true,
              visible: true,
              options: this.selectedAttributes[attrId]
            });
          }
        }
        
        if (attributes.length > 0) {
          payload.attributes = attributes;
        }
      }

      let createdProduct: any;

      if (this.isEdit) {
        createdProduct = await this.authService.updateProduct(this.productId, payload);
        
        // Create variations if variable product
        if (this.product.type === 'variable' && this.attributes?.length) {
          await this.createVariations(createdProduct.id || this.productId);
        }
        
        await this.showAlertWithCallback(
          'Product Updated',
          'Updated successfully',
          'success',
          () => this.navigateToProductList()
        );
      } else {
        createdProduct = await this.authService.createProduct(payload);
        
        // Create variations if variable product
        if (this.product.type === 'variable' && this.attributes?.length) {
          await this.createVariations(createdProduct.id);
        }
        
        await this.showAlertWithCallback(
          'Product Created',
          'Created successfully',
          'success',
          () => this.navigateToProductList()
        ); 
      }

    } catch (error: any) {
      console.error('Operation failed:', error);
      await this.showAlert(
        'Operation Failed',
        error?.response?.data?.message || error?.message || 'Something went wrong',
        'danger'
      );
    }
  }

  // New method to navigate to product list
  navigateToProductList() {
    // Use replaceUrl: true to replace current page in history
    this.router.navigate(['/products-list'], { 
      replaceUrl: true,
      queryParams: { refresh: true, timestamp: Date.now() } // Add timestamp to force refresh
    });
  }

  // Alternative: Alert with callback for success cases
  async showAlertWithCallback(
    header: string,
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
    callback?: () => void
  ) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            if (callback) {
              callback();
            }
          },
        },
      ],
      cssClass: `alert-${color}`,
    });

    await alert.present();
  }


  getAttributeName(attrId: number): string {
    const attr = this.attributes.find(a => a.id === attrId);
    return attr?.name || `Attribute ${attrId}`;
  }

  async createVariations(productId: number) {
    try {
      // Get all combinations
      const combinations = this.generateCombinations();
      
      for (const combo of combinations) {
        const variationPayload = {
          regular_price: this.product.regular_price || '0',
          attributes: combo
        };
        
        await this.authService.createVariation(productId, variationPayload);
      }
    } catch (error) {
      console.error('Failed to create variations', error);
    }
  }

  generateCombinations(): any[] {
    const attributeEntries = Object.entries(this.selectedAttributes);
    
    if (attributeEntries.length === 0) {
      return [];
    }

    // Generate all combinations of selected attribute options
    return attributeEntries.reduce((acc: any[], [attrId, options]) => {
      if (!Array.isArray(options) || options.length === 0) {
        return acc;
      }

      if (acc.length === 0) {
        // First attribute - create initial array of arrays
        return options.map(option => [{ 
          id: Number(attrId), 
          name: this.getAttributeName(Number(attrId)),
          option 
        }]);
      }

      // For existing combinations, create new combinations with each option
      const newCombinations: any[] = [];
      
      acc.forEach(existing => {
        options.forEach(option => {
          newCombinations.push([
            ...existing,
            { 
              id: Number(attrId), 
              name: this.getAttributeName(Number(attrId)),
              option 
            }
          ]);
        });
      });
      
      return newCombinations;
    }, []);
  }

  // Watch for product type changes
  onProductTypeChange() {
    if (this.product.type === 'variable') {
      this.loadAttributes();
    } else {
      this.selectedAttributes = {};
    }
  }

  saveDraft() {
    this.product.status = 'draft';
    this.publishProduct();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  async showAlert(
    header: string,
    message: string,
    color: 'success' | 'danger' = 'success',
    redirect = false
  ) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            if (redirect) {
              this.router.navigate(['/products-list'], { replaceUrl: true });
            }
          },
        },
      ],
      cssClass: color === 'success' ? 'alert-success' : 'alert-danger',
    });

    await alert.present();
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Delete product?',
      message: 'This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteProduct(),
        },
      ],
    });

    await alert.present();
  }

  async deleteProduct() {
    try {
      await this.authService.deleteProduct(this.productId);
      await this.showAlert(
        'Product Deleted',
        'Product deleted successfully',
        'success',
        true
      );
    } catch (error) {
      await this.showAlert(
        'Delete Failed',
        'Failed to delete product',
        'danger'
      );
    }
  }

  // Helper methods to add to the component class
  logSelectedAttributes() {
    console.log('Selected attributes:', this.selectedAttributes);
  }

  getSelectedAttributesCount(): number {
    return Object.values(this.selectedAttributes)
      .filter(options => options && options.length > 0)
      .length;
  }

  getCombinationCount(): number {
    return this.generateCombinations().length;
  }
  
  async scanSku() {
    const code = await this.barcodeService.scan();
    if (code) {
      this.product.sku = code;
    }
  }

  /////////////////////////////////////// priya
  removeImage() {
    this.imagePreview = null;
    this.selectedFile = null;
  }

  taxClasses = [
    { id: 1, name: 'Standard rate', percentage: 18 },
    { id: 2, name: 'Reduced rate', percentage: 5 },
    { id: 3, name: 'Zero rate', percentage: 0 }
  ];

  selectedTaxClass: any = null;

  editRegularPrice = false;
  editSalePrice = false;
  
  /////////////////////////////////////// priya

}

