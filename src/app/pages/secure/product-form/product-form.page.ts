import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BarcodeService } from 'src/app/services/barcode-service.service';
import { ViewChild } from '@angular/core';
import { IonInput, IonTextarea } from '@ionic/angular';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.page.html',
  styleUrls: ['./product-form.page.scss'],
  imports: [IonicModule, CommonModule, RouterModule],
})
export class ProductFormPage implements OnInit {

  @ViewChild('titleInput') titleInput!: IonInput;
@ViewChild('descInput') descInput!: IonTextarea;
@ViewChild('regularPriceInput') regularPriceInput!: IonInput;
@ViewChild('salePriceInput') salePriceInput!: IonInput;

  isEdit = false;
  productId!: number;
  imagePreview: string | null = null;
  selectedFile!: File;
  categories: any[] = [];
  tags: any[] = [];
  attributes: any[] = [];
  generatedCombinations: any[] = [];
  variationPrices: { [key: string]: number } = {};
  selectedAttributes: { [key: number]: string[] } = {};
  expandedAttributes: { [key: number]: boolean } = {};
  private attributesLoaded = false;
  private isLoadingAttributes = false;
  // stock_quantity : any = null;
  stock_status: any = null;
  isScanning = false;
  pageReady = false;
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
    // featured: false,
    sold_individually: false,
    reviews_allowed: true,
    selectedTaxClass:'',
    // stock_quantity: null,
    manage_stock: false,
    category_id: null,
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

  // detect edit mode immediately
  if (id) {
    this.isEdit = true;
    this.productId = +id;
  }

  // load base data
  await this.loadCategories();
  await this.loadTags();
  await this.loadTaxClasses();

  // load product if editing
  if (this.isEdit) {
    await this.loadProduct();
  }

  if (this.product.type === 'variable') {
    await this.loadAttributes();
  }

  // ✅ allow UI to render
  this.pageReady = true;
}
  // buildVariationKey(combo: any[]): string {
  //   return combo
  //     .map(a => `${a.id}_${a.option}`)
  //     .sort()
  //     .join('|');
  // }
  // buildVariationKey(attributes: any[]): string {
  //   return attributes
  //     .map(attr => `${attr.id}_${attr.option}`)
  //     .sort()
  //     .join('|');
  // }
  buildVariationKey(attributes: any[]): string {
    return attributes
      .sort((a, b) => a.id - b.id) // sort by attribute id
      .map(attr => {
        const termObj = this.getTermByName(attr.id, attr.option);
        const slug = termObj?.slug || attr.option;
        return `${attr.id}_${slug}`;
      })
      .join('|');
  }
  getComboLabel(combo: any[]): string {
    return combo.map(a => a.option).join(' + ');
  }

  getVariationPrice(combo: any[]) {
    return this.variationPrices[
      this.buildVariationKey(combo)
    ] || '';
  }

  setVariationPrice(combo: any[], value: any) {
    const key = this.buildVariationKey(combo);
    this.variationPrices[key] = Number(value || 0);
    // console.log(this.variationPrices);
  }
  toggleAttribute(attrId: number) {
    this.expandedAttributes[attrId] =
      !this.expandedAttributes[attrId];
  }
  // onAttributeToggle(attrId: number, term: string, event: any) {

  //   if (!this.selectedAttributes[attrId]) {
  //     this.selectedAttributes[attrId] = [];
  //   }

  //   if (event.detail.checked) {
  //     if (!this.selectedAttributes[attrId].includes(term)) {
  //       this.selectedAttributes[attrId].push(term);
  //     }
  //   } else {
  //     this.selectedAttributes[attrId] =
  //       this.selectedAttributes[attrId]
  //         .filter(t => t !== term);
  //   }

  //   this.generatedCombinations =
  //     this.generateCombinations();
  // }
  onAttributeToggle(attrId: number, term: string, event: any) {
    if (!this.selectedAttributes[attrId]) {
      this.selectedAttributes[attrId] = [];
    }

    if (event.detail.checked) {
      if (!this.selectedAttributes[attrId].includes(term)) {
        this.selectedAttributes[attrId].push(term);
      }
    } else {
      this.selectedAttributes[attrId] =
        this.selectedAttributes[attrId]
          .filter(t => t !== term);
    }

    this.generatedCombinations =
      this.generateCombinations();

    console.log('Generated:', this.generatedCombinations);
  }
  async loadProduct() {
    try {
      // this.isEditMode = !!this.productId;
      const res = await this.authService.getProductById(this.productId);
      await this.loadExistingVariations();
      console.log(res);
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
        // featured: res.featured,
        sold_individually: res.sold_individually,
        reviews_allowed: res.reviews_allowed,
        category_id: res.categories?.[0]?.id || null,
        tag_ids: res.tags?.map((t: any) => t.id) || [],
        // stock_quantity: res.stock_quantity,
        manage_stock: res.manage_stock,
      };
      this.stock_status = res.stock_status;
      console.log(this.stock_status);
      this.selectedTaxClass = this.taxClasses.find(
        tax => tax.slug === res.tax_class
      ) || null;
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
                const optionsArray = Array.isArray(attr.options)
                ? attr.options
                : [attr.options];
                // this.assignedAttributeTerms[attr.id] = [...optionsArray];
            }
          });
        }
        const variations =
          await this.authService.getProductVariations(this.productId);

        this.generatedCombinations = variations.map((variation: any) =>
          variation.attributes.map((attr: any) => ({
            id: attr.id,
            option: attr.option
          }))
        );

        this.variationPrices = {};

        variations.forEach((variation: any) => {

          // const key = variation.attributes
          //   .map((attr: any) => `${attr.id}_${attr.option}`)
          //   .sort()
          //   .join('|');
          const key = this.buildVariationKey(variation.attributes);
          this.variationPrices[key] =
            Number(variation.regular_price);
        });
        // console.log('selected attributes');
        // console.log(this.selectedAttributes);
        this.mapVariationsToUI(variations);
      }

    } catch (e) {
      console.error('Failed to load product', e);
    }
  }
  async loadExistingVariations() {
    try {
      const response =
        await this.authService.getProductVariations(this.productId);

      const variations = Array.isArray(response)
        ? response
        : response?.data || [];

      this.generatedCombinations = [];
      this.variationPrices = {};

      variations.forEach((variation: any) => {

        if (!variation.attributes) return;

        const combo = variation.attributes.map((attr: any) => ({
          id: attr.id,
          option: attr.option
        }));

        this.generatedCombinations.push(combo);

        const key = this.buildVariationKey(combo);

        this.variationPrices[key] =
          Number(variation.regular_price || 0);
      });

    } catch (error) {
      console.error('Load variations failed', error);
    }
  }
  mapVariationsToUI(variations: any[]) {
    for (const variation of variations) {

      const price = Number(variation.regular_price || 0);

      for (const attr of variation.attributes) {

        const attrId = attr.id;
        const optionSlug = attr.option;

        if (!this.selectedAttributes[attrId]) {
          this.selectedAttributes[attrId] = [];
        }

        if (!this.selectedAttributes[attrId].includes(optionSlug)) {
          this.selectedAttributes[attrId].push(optionSlug);
        }
      }
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
  get stockLabel(): string {
    // console.log(this.stock_status);
    if(this.isEdit)
    {
      return this.stock_status === 'instock'
      ? 'In stock'
      : 'Out of stock';
    }
    return '';
  }
  // async loadAttributes() {
  //   try {
  //     this.attributes = [];
  //     const attrs = await this.authService.getAttributes();
      
  //     for (const attr of attrs.data || attrs) {
  //       try {
  //         const terms = await this.authService.getAttributeTerms(attr.id);
          
  //         // Fix the terms data structure
  //         const termsArray = terms.data || terms || [];
          
  //         this.attributes.push({
  //           id: attr.id,
  //           name: attr.name,
  //           slug: attr.slug,
  //           type: attr.type,
  //           terms: Array.isArray(termsArray) ? termsArray : []
  //         });
  //       } catch (error) {
  //         console.error(`Failed to load terms for attribute ${attr.id}`, error);
  //         this.attributes.push({
  //           id: attr.id,
  //           name: attr.name,
  //           slug: attr.slug,
  //           type: attr.type,
  //           terms: []
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to load attributes', error);
  //   }
  // }
  async loadAttributes(forceReload: boolean = false) {

    // Prevent multiple calls
    if ((this.attributesLoaded || this.isLoadingAttributes) && !forceReload) {
      console.log('Attributes already loaded. Skipping API call.');
      return;
    }

    this.isLoadingAttributes = true;

    try {
      console.log('Loading attributes from API...');

      const attrsResponse = await this.authService.getAttributes();
      const attributeList = attrsResponse?.data || attrsResponse || [];

      if (!Array.isArray(attributeList)) {
        console.error('Invalid attribute response format');
        this.attributes = [];
        return;
      }
      
      const attributePromises = attributeList.map(async (attr: any) => {
        try {
          const termsResponse = await this.authService.getAttributeTerms(attr.id);
          const termsArray = termsResponse?.data || termsResponse || [];

          return {
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            terms: Array.isArray(termsArray) ? termsArray : []
          };

        } catch (error) {
          console.error(`Failed to load terms for attribute ${attr.id}`, error);

          return {
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            terms: []
          };
        }
      });

      this.attributes = await Promise.all(attributePromises);

      this.attributesLoaded = true;

      console.log('Attributes loaded successfully:', this.attributes);

    } catch (error) {
      console.error('Failed to load attributes', error);
      this.attributes = [];
    } finally {
      this.isLoadingAttributes = false;
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
        // featured: this.product.featured,
        sold_individually: this.product.sold_individually,
        reviews_allowed: this.product.reviews_allowed,
        tax_status: this.selectedTaxClass ? 'taxable' : 'none',
        tax_class: this.selectedTaxClass?.slug || '',
        // stock_quantity: this.product.stock_quantity,
        // manage_stock: Number(this.product.stock_quantity) > 0 ? true : false
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
      if (this.product.category_id) {
  payload.categories = [{ id: this.product.category_id }];
}

      if (this.product.tag_ids?.length) {
        payload.tags = this.product.tag_ids.map((id: number) => ({ id }));
      }

      // Upload image if new file selected
      if (this.selectedFile) {
        try {
          const media = await this.authService.uploadMedia(this.selectedFile);
          console.log(media);
          payload.images = [{ id: media.id }];
          console.log(payload.images);
        } catch (error) {
          console.error('Failed to upload image', error);
        }
      } else if (this.imagePreview && this.imagePreview.startsWith('http')) {
        // Keep existing image if editing and no new file selected
        payload.images = [{ src: this.imagePreview }];
      }

      if (this.product.type === 'variable') {

        const attributes = [];

        for (const attrId in this.selectedAttributes) {

          const selectedTerms = this.selectedAttributes[attrId];
          if (!selectedTerms?.length) continue;

          const mergedOptions = [
            ...new Set([
              ...selectedTerms
            ])
          ];

          attributes.push({
            id: Number(attrId),
            name: this.getAttributeName(Number(attrId)),
            variation: true,
            visible: true,
            options: mergedOptions
          });
        }

        if (attributes.length > 0) {
          payload.attributes = attributes;
        }
      }
      let createdProduct: any;

      if (this.isEdit) 
      {
        console.log(payload);
        createdProduct = await this.authService.updateProduct(this.productId, payload);
        payload.attributes?.forEach(attr => {
          attr.options.forEach((option: string) => {

            const termObj = this.getTermByName(attr.id, option);
            if (!termObj) return;

            // const key = this.buildVariationKey(attr.id, termObj.slug);
            const key = `${attr.id}_${termObj.slug}`;
            // this.savedVariationOptions[key] = true;
          });
        });
        if (this.product.type === 'variable' && this.attributes?.length) {
          await this.createVariations(createdProduct.id || this.productId);
        }
        
        await this.showAlertWithCallback(
          'Product Updated',
          'Updated successfully',
          'success',
          () => this.navigateToProductList()
        );
      } 
      else 
      {
        console.log(payload);
        createdProduct = await this.authService.createProduct(payload);
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
  getTermByName(attrId: number, termName: string) {
    if (!this.attributes?.length) return null;

    const attribute = this.attributes.find((a: any) => a.id === attrId);
    if (!attribute?.terms?.length) return null;

    return attribute.terms.find((t: any) =>
      t.name?.toLowerCase().trim() === termName?.toLowerCase().trim()
    ) || null;
  }
  navigateToProductList() {
    this.router.navigate(['/products-list'], { 
      replaceUrl: true,
      queryParams: { refresh: true, timestamp: Date.now() } // Add timestamp to force refresh
    });
  }
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

      const combinations = this.generateCombinations();
      // console.log(combinations);
      const existingVariations =
        await this.authService.getProductVariations(productId);
      // console.log(existingVariations);
      const variationMap = new Map<string, any>();

      existingVariations.forEach((variation: any) => {
        // const key = variation.attributes
        //   .map((attr: any) => `${attr.id}_${attr.option}`)
        //   .sort()
        //   .join('|');
        const key = this.buildVariationKey(variation.attributes);
        variationMap.set(key, variation);
      });

      for (const combo of combinations) {

        const key = this.buildVariationKey(combo);
        const price = this.variationPrices[key] ?? 0;
        // console.log('Creating variation combo:', key);
        if (variationMap.has(key)) {

          await this.authService.updateVariation(
            productId,
            variationMap.get(key).id,
            { regular_price: price.toString() }
          );

        } else {

          await this.authService.createVariation(
            productId,
            {
              regular_price: price.toString(),
              // attributes: combo.map(attr => ({
              //   id: attr.id,
              //   option: attr.option
              // }))
              attributes: combo.map(attr => {
                const termObj = this.getTermByName(attr.id, attr.option);

                return {
                  id: attr.id,
                  option: termObj?.slug || attr.option
                };
              })
            }
          );
        }
      }

    } catch (error) {
      console.error('Variation sync failed', error);
    }
  }
  // generateCombinations(): any[] {
  //   const attributeEntries = Object.entries(this.selectedAttributes);
    
  //   if (attributeEntries.length === 0) {
  //     return [];
  //   }

  //   // Generate all combinations of selected attribute options
  //   return attributeEntries.reduce((acc: any[], [attrId, options]) => {
  //     if (!Array.isArray(options) || options.length === 0) {
  //       return acc;
  //     }

  //     if (acc.length === 0) {
  //       // First attribute - create initial array of arrays
  //       return options.map(option => [{ 
  //         id: Number(attrId), 
  //         name: this.getAttributeName(Number(attrId)),
  //         option 
  //       }]);
  //     }

  //     // For existing combinations, create new combinations with each option
  //     const newCombinations: any[] = [];
      
  //     acc.forEach(existing => {
  //       options.forEach(option => {
  //         newCombinations.push([
  //           ...existing,
  //           { 
  //             id: Number(attrId), 
  //             name: this.getAttributeName(Number(attrId)),
  //             option 
  //           }
  //         ]);
  //       });
  //     });
      
  //     return newCombinations;
  //   }, []);
  // }

  // Watch for product type changes
  onProductTypeChange() {
    if (this.product.type === 'variable') {
      this.loadAttributes();
    } else {
      this.selectedAttributes = {};
    }
  }
  // generateCombinations(): any[] {

  //   const attributeEntries: any[] = [];

  //   for (const attrId in this.selectedAttributes) {
  //     const options = this.selectedAttributes[attrId];

  //     if (options && options.length > 0) {
  //       attributeEntries.push({
  //         id: Number(attrId),
  //         options
  //       });
  //     }
  //   }

  //   if (attributeEntries.length === 0) {
  //     return [];
  //   }

  //   const result: any[] = [];

  //   const helper = (current: any[], index: number) => {

  //     if (index === attributeEntries.length) {
  //       result.push(current);
  //       return;
  //     }

  //     const attribute = attributeEntries[index];

  //     for (const option of attribute.options) {
  //       helper(
  //         [...current, { id: attribute.id, option }],
  //         index + 1
  //       );
  //     }
  //   };

  //   helper([], 0);

  //   return result;
  // }
  // generateCombinations(): any[] {
  //   const attributeEntries: any[] = [];
  //   for (const attr of this.attributes) {
  //     const options =
  //       this.selectedAttributes[attr.id];
  //     if (!options || options.length === 0) {
  //       return [];
  //     }

  //     attributeEntries.push({
  //       id: attr.id,
  //       options
  //     });
      
  //   }
  //   console.log(attributeEntries);
  //   const result: any[] = [];
  //   const helper = (current: any[], index: number) => {
  //     if (index === attributeEntries.length) {
  //       result.push(current);
  //       return;
  //     }

  //     const attribute = attributeEntries[index];

  //     for (const option of attribute.options) {
  //       helper(
  //         [...current, { id: attribute.id, option }],
  //         index + 1
  //       );
  //     }
  //   };
  //   helper([], 0);
  //   return result;
  // }
  generateCombinations(): any[] {
    const attributeEntries: any[] = [];
    // console.log(this.selectedAttributes);
    for (const attrId in this.selectedAttributes) {
      const options = this.selectedAttributes[attrId];

      if (options && options.length > 0) {
        attributeEntries.push({
          id: Number(attrId),
          options
        });
      }
    }

    if (attributeEntries.length === 0) {
      return [];
    }

    const result: any[] = [];

    const helper = (current: any[], index: number) => {

      if (index === attributeEntries.length) {
        result.push(current);
        return;
      }

      const attribute = attributeEntries[index];

      for (const option of attribute.options) {
        helper(
          [...current, { id: attribute.id, option }],
          index + 1
        );
      }
    };

    helper([], 0);

    return result;
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
  async loadTaxClasses() {
    try {
      const classesRes = await this.authService.getTaxClasses();
      const ratesRes = await this.authService.getTaxRates();

      const classes = classesRes.data;
      const rates = ratesRes.data;

      // Add Standard manually (WooCommerce does not return it)
      const formattedClasses = [
        // { slug: '', name: 'Standard rate' },
        ...classes
      ];

      this.taxClasses = formattedClasses.map(cls => {

        const matchingRate = rates.find(
          (rate: any) => rate.class === cls.slug
        );

        return {
          name: cls.name,
          slug: cls.slug,
          percentage: matchingRate ? Number(matchingRate.rate) : 0
        };
      });

      console.log('Loaded Tax Classes:', this.taxClasses);

    } catch (error) {
      console.error('Failed to load tax classes', error);
    }
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

  // getSelectedAttributesCount(): number {
  //   return Object.values(this.selectedAttributes)
  //     .filter(options => options && options.length > 0)
  //     .length;
  // }
  getSelectedAttributesCount(): number {
    return Object.values(this.selectedAttributes)
      .filter((options: any) => Array.isArray(options) && options.length > 0)
      .length;
  }
  getCombinationCount(): number {
    return this.generateCombinations().length;
  }
  
  async scanSku() {
    this.isScanning = true;
    const code = await this.barcodeService.scan();
    this.isScanning = false;
    if (code) {
      this.product.sku = code;
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.selectedFile = null;
  }

  enableTitleEdit() {
  this.editTitle = true;

  setTimeout(() => {
    this.titleInput?.setFocus();
  }, 100);
}

enableDescriptionEdit() {
  this.editDescription = true;

  setTimeout(() => {
    this.descInput?.setFocus();
  }, 100);
}

enableRegularPriceEdit() {
  this.editRegularPrice = true;

  setTimeout(() => {
    this.regularPriceInput?.setFocus();
  }, 100);
}

enableSalePriceEdit() {
  this.editSalePrice = true;

  setTimeout(() => {
    this.salePriceInput?.setFocus();
  }, 150);
}
getCategoryName(id: number): string {
  const cat = this.categories.find(c => c.id === id);
  return cat ? cat.name : '';
}

onPriceInput(event: any, field: 'regular_price' | 'sale_price') {
  let value = event.target.value || '';

  // remove all non-numbers
  value = value.replace(/\D/g, '');

  // convert to decimal
  const numberValue = Number(value) / 100;

  // save value
  this.product[field] = numberValue.toFixed(2);
}

formatPrice(value: any): string {
  if (!value) return '';

  return Number(value).toFixed(2);
}
  // taxClasses = [
  //   { id: 1, name: 'Standard rate', percentage: 18, slug: '' },
  //   { id: 2, name: 'Reduced rate', percentage: 5, slug: 'reduced-rate' },
  //   { id: 3, name: 'Zero rate', percentage: 0, slug: 'zero-rate' }
  // ];
  taxClasses: any[] = [];
  selectedTaxClass: any = null;

  editRegularPrice = false;
  editSalePrice = false;
  editTitle = false;
editDescription = false;
}