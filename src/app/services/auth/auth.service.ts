import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import axios from 'axios';
import { AssetsService } from '../assets/assets.service';
import { ApiConfigService } from '../api-config.service';
import { Http } from '@capacitor-community/http';
@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$: Observable<any | null> = this.currentUserSubject.asObservable();
  private base = '';
  private wpBase = '';
  constructor(
    private assetsService: AssetsService,
    private apiConfig: ApiConfigService,
  ) {
    this.loadUserFromStorage();
    this.wpBase = localStorage.getItem('wp_base_url');
    this.base = localStorage.getItem('wp_base_url');
  }


  /** Load user when app refreshes */
  private loadUserFromStorage() {
    const user = localStorage.getItem('user_data');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }


async login(email: string, password: string, siteUrl: string) {

  try {

    this.apiConfig.setBaseUrl(siteUrl);

    const baseUrl = this.apiConfig.getBaseUrl();
    const loginUrl = `${baseUrl}/wp-json/pinaka-pos/v1/token/email`;

    console.log("🔥 USING NATIVE HTTP");

    const res = await Http.request({
      method: 'POST',
      url: loginUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { email, password }
    });

    console.log("LOGIN RESPONSE:", res.data);

    const data = typeof res.data === 'string'
      ? JSON.parse(res.data)
      : res.data;

    const token = data?.data?.token;

    if (!token) throw new Error("Token missing");

    localStorage.setItem('wc_token', token);
    localStorage.setItem('user_data', JSON.stringify(data.data));

    this.currentUserSubject.next(data.data);

    await this.assetsService.loadAssets();

    return data;

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    throw err;
  }
}



  logout() {
    localStorage.removeItem('wc_token');
    localStorage.removeItem('user_data');
    this.apiConfig.clear();
    this.assetsService.clearAssets();
    this.currentUserSubject.next(null);
  }

  /** Sync access (guards, interceptors) */
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('wc_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('wc_token');
  }

async getDashboardStats(status: string): Promise<number> {

  const token = localStorage.getItem('wc_token');
  this.wpBase = this.apiConfig.getBaseUrl();

  try {
    const res = await Http.request({
      method: 'GET',
      url: `${this.wpBase}/wp-json/pinaka-pos/v1/orders/order-counts-for-admin-app`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      params: { status }
    });

    if (res.data?.total !== undefined) {
      return Number(res.data.total);
    }

    return 0;

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return 0;
  }
}



   async getOrders(page: number, search: string = '') {

    const token = localStorage.getItem('wc_token');

    const res = await Http.request({
      method: 'GET',
      url: `${this.wpBase}/wp-json/wc/v3/orders`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      params: {
        page: String(page),
        per_page: '10',
        orderby: 'date',
        order: 'desc',
        search: search || undefined
      }
    });

    // Capacitor may return JSON as string
    const data =
      typeof res.data === 'string'
        ? JSON.parse(res.data)
        : res.data;

    return data;
  }


  async getProducts(page: number, search: string = '', stock: string = '') {  
    const token = localStorage.getItem('wc_token');
    const res = await Http.request({
      method: 'GET',
      url: `${this.wpBase}/wp-json/wc/v3/products`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      params: {
        page: String(page),
        per_page: '10',
        orderby: 'date',
        order: 'desc',
        search: search || undefined
      }
    });

    return res.data;
  }

async createProduct(product: any) {

  const token = localStorage.getItem('wc_token');

  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/wc/v3/products`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    data: product
  });

  const data =
    typeof res.data === 'string'
      ? JSON.parse(res.data)
      : res.data;

  return data;
}

async updateProduct(id: number, product: any) {

  const token = localStorage.getItem('wc_token');

  const res = await Http.request({
    method: 'PUT',
    url: `${this.wpBase}/wp-json/wc/v3/products/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    data: product
  });

  const data =
    typeof res.data === 'string'
      ? JSON.parse(res.data)
      : res.data;

  return data;
}

async deleteProduct(id: number) {

  const token = localStorage.getItem('wc_token');

  const res = await Http.request({
    method: 'DELETE',
    url: `${this.wpBase}/wp-json/wc/v3/products/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    params: {
      force: 'true'
    }
  });

  const data =
    typeof res.data === 'string'
      ? JSON.parse(res.data)
      : res.data;

  return data;
}
async getProductById(id: number) {

  const token = localStorage.getItem('wc_token');

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/products/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  const data =
    typeof res.data === 'string'
      ? JSON.parse(res.data)
      : res.data;

  return data;
}


private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async uploadMedia(file: File) {

  const base64Data = await this.fileToBase64(file);

  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/wp/v2/media`,
    headers: {
      ...this.getAuthHeaders(),
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${file.name}"`
    },
    data: base64Data
  });

  return typeof res.data === 'string'
    ? JSON.parse(res.data)
    : res.data;
}

async getCategories(page = 1, perPage = 100) {

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/products/categories`,
    headers: this.getAuthHeaders(),
    params: {
      page: String(page),
      per_page: String(perPage)
    }
  });

  return typeof res.data === 'string'
    ? JSON.parse(res.data)
    : res.data;
}

async getTags() {

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/products/tags`,
    headers: this.getAuthHeaders()
  });

  return typeof res.data === 'string'
    ? JSON.parse(res.data)
    : res.data;
}

async createUser(newUser: any) {

  const res = await Http.request({
    method: 'POST',
    url: `${this.base}/wp-json/wp/v2/users`,
    headers: this.getAuthHeaders(),
    data: newUser
  });

  return typeof res.data === 'string'
    ? JSON.parse(res.data)
    : res.data;
}

async getUsers(
  role = '',
  page = 1,
  perPage = 10,
  userRole = '',
  search = ''
) {

  const params: any = {
    page,
    per_page: perPage,
    context: 'edit'
  };

  if (search) params.search = search;
  if (role) params.role = role;

  if (userRole === 'customer') {
    params.role = 'customer';
  } else if (userRole === 'employee') {
    params.role__not_in = ['customer'];
  }

  const res = await Http.request({
    method: 'GET',
    url: `${this.base}/wp-json/wp/v2/users`,
    headers: this.getAuthHeaders(),
    params
  });

  const data =
    typeof res.data === 'string'
      ? JSON.parse(res.data)
      : res.data;

  return {
    users: data,
    totalPages: Number(res.headers?.['x-wp-totalpages'] || 1)
  };
}



  async createUserWithMeta(user: any) {
  try {
    console.log('Creating user with data:', user);

    if (!user?.username || !user?.email || !user?.password) {
      throw new Error('Username, email and password are required.');
    }

    const res = await Http.request({
      method: 'POST',
      url: `${this.wpBase}/wp-json/pinaka-pos/v1/users/create-user-with-meta`,
      headers: this.getAuthHeaders(),
      data: {
        username: user.username,
        email: user.email,
        password: user.password,
        roles: [user.role],
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        description: user.phone || '',
        meta: {
          emp_login_pin: user.emp_login_pin || '',
        },
      },
    });

    return res.data;

  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}


async getCustomRoles() {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/orders/custom-user-roles`,
    headers: this.getAuthHeaders(),
  });

  return res.data;
}


async updateUser(id: number, data: any) {
  console.log('Updating user with data:', data);

  const res = await Http.request({
    method: 'PUT',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/users/update-user-with-meta/${id}`,
    headers: this.getAuthHeaders(),
    data: data,
  });

  return res.data;
}


async deleteUser(id: number) {
  const res = await Http.request({
    method: 'DELETE',
    url: `${this.base}/users/${id}`,
    headers: this.getAuthHeaders(),
    params: {
      force:"1",
      reassign: "0",
    },
  });

  return res.data;
}


async getShifts(page: number, search = '', status = '') {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/shifts/get-all-shifts`,
    headers: this.getAuthHeaders(),
    params: {
      page: String(page),
      per_page: "10",
      search,
      status,
    },
  });

  return res.data;
}


async getOrderPayments(
  page: number,
  search = '',
  status = ''
) {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/payments/get-all-paments-for-admin`,
    headers: this.getAuthHeaders(),
    params: {
      page: String(page) ,
      per_page: "10",
      search,
      status,
    },
  });

  return res.data; // { data, pagination }
}


// List Media
async getMedia(page = "1", perPage = "20") {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wp/v2/media`,
    headers: this.getAuthHeaders(),
    params: {
      page: String(page) ,
      per_page: perPage,
    },
  });

  return res.data;
}


// Update Media (title / alt)
async updateMedia(id: number, data: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/wp/v2/media/${id}`,
    headers: this.getAuthHeaders(),
    data,
  });

  return res.data;
}


// Delete Media
async deleteMedia(id: number) {
  const res = await Http.request({
    method: 'DELETE',
    url: `${this.wpBase}/wp-json/wp/v2/media/${id}`,
    headers: this.getAuthHeaders(),
    params: {
      force: "1",
    },
  });

  return res.data;
}


// Vendors
async getVendors(page = 1, perPage = "10") {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/get-all-vendors-for-admin`,
    headers: this.getAuthHeaders(),
    params: {
      page: String(page),
      per_page: perPage,
    },
  });

  return res.data;
}


// Product Attributes
async getAttributes() {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/products/attributes`,
    headers: this.getAuthHeaders(),
  });

  return res.data;
}


async getAttributeTerms(attributeId: number) {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/products/attributes/${attributeId}/terms`,
    headers: this.getAuthHeaders(),
  });

  return res.data;
}


async createVariation(productId: number, data: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/wc/v3/products/${productId}/variations`,
    headers: this.getAuthHeaders(),
    data,
  });

  return res.data;
}


// WooCommerce Customer Creation
async createWooCommerceCustomer(customerData: any) {

  const url = `${this.wpBase}/wp-json/wc/v3/customers`;

  const payload = {
    email: customerData.email,
    first_name: customerData.first_name || '',
    last_name: customerData.last_name || '',
    username: customerData.username,
    password: customerData.password,
    billing: customerData.billing || {},
    shipping: customerData.shipping || {},
    meta_data: customerData.meta_data || []
  };

  try {
    const response = await Http.request({
      method: 'POST',
      url,
      headers: this.getAuthHeaders(),
      data: payload
    });

    return response.data;

  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
}


// Get Customer Roles (optional)
async getCustomerRoles() {

  const url = `${this.wpBase}/wp-json/wp/v2/users/roles`;

  try {
    const response = await Http.request({
      method: 'GET',
      url,
      headers: this.getAuthHeaders(),
    });

    return response.data;

  } catch (error) {
    console.error('Get roles error:', error);
    return [];
  }
}


// Daily Sales (WooCommerce)
async getDailySales(startDate: string, endDate: string) {

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/orders`,
    headers: this.getAuthHeaders(),
    params: {
      after: `${startDate}T00:00:00`,
      before: `${endDate}T23:59:59`,
      per_page: "100",
      status: 'completed'
    }
  });

  return res.data;
}


// Reports - Sales
async loadSales(date: string) {

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/reports/sales`,
    headers: this.getAuthHeaders(),
    params: { date }
  });

  return res.data;
}


// Reports - Employee Sales
async loadEmployeeSales(date: string) {

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/reports/employee-sales`,
    headers: this.getAuthHeaders(),
    params: { date }
  });

  return res.data;
}


// Reports - Item Sales
async loadItemSales(date: string) {

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/reports/item-sales`,
    headers: this.getAuthHeaders(),
    params: { date }
  });

  return res.data;
}

// Inventory
async loadInventory(date: string, page = "1", per_page = "50") {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/reports/inventory`,
    headers: this.getAuthHeaders(),
    params: { date, page, per_page }
  });

  return res.data;
}


// Coupons
async getCoupons() {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/coupons`,
    headers: this.getAuthHeaders()
  });

  return res.data;
}

async createCoupon(data: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/wc/v3/coupons`,
    headers: this.getAuthHeaders(),
    data
  });

  return res.data;
}

async updateCoupon(id: number, data: any) {
  const res = await Http.request({
    method: 'PUT',
    url: `${this.wpBase}/wp-json/wc/v3/coupons/${id}`,
    headers: this.getAuthHeaders(),
    data
  });

  return res.data;
}

async deleteCoupon(id: number) {
  const res = await Http.request({
    method: 'DELETE',
    url: `${this.wpBase}/wp-json/wc/v3/coupons/${id}`,
    headers: this.getAuthHeaders(),
    params: { force: "1" }
  });

  return res.data;
}


// Cash Settings
async getCashSettings() {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/cash-settings`,
    headers: this.getAuthHeaders()
  });

  return res.data;
}

async saveCashSettings(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/cash-settings`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}

async saveDenominations(type: string, payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/denominations/${type}`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


// Forgot Password
async forgotPassword(email: string) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka/v1/forgot-password`,
    data: { email }
  });

  return res.data;
}


// Discounts
async getDiscounts(page = "1", perPage = "10") {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/get-all-discounts-for-admin`,
    headers: this.getAuthHeaders(),
    params: { page, per_page: perPage }
  });

  return res.data;
}

async createDiscount(data: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/create-discount`,
    headers: this.getAuthHeaders(),
    data
  });

  return res.data;
}

async updateDiscount(id: number, data: any) {
  data.discount_id = id;

  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/update-discount/`,
    headers: this.getAuthHeaders(),
    data
  });

  return res.data;
}

async getProductsByIds(ids: number[], data: any = {}) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/by-ids`,
    headers: this.getAuthHeaders(),
    data: { ...data, ids }
  });

  return res.data;
}


// Product Search
async searchProducts(term: string) {
  const res = await Http.request({
    method: 'GET',
    url: `${this.wpBase}/wp-json/wc/v3/products`,
    headers: this.getAuthHeaders(),
    params: { search: term }
  });

  return res.data;
}


// Delete Discount
async deleteDiscount(id: number, type: string, data: any = {}) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/delete-discount`,
    headers: this.getAuthHeaders(),
    data: { ...data, id, type }
  });

  return res.data;
}


// Business Settings
async saveBussinessInfo(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/business-info`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}

async enableTaxes(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-taxes`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}

async enableCoupons(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-coupons`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}

async sequentialCoupons(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/sequential-coupons`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


// Categories
async saveCategory(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/wc/v3/products/categories`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}

async deleteCategory(id: number) {
  const res = await Http.request({
    method: 'DELETE',
    url: `${this.wpBase}/wp-json/wc/v3/products/categories/${id}`,
    headers: this.getAuthHeaders(),
    params: { force: "1" }
  });

  return res.data;
}


async updateEnableSafes(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-safes`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


async updateEnableSafesDrop(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-safes-drop`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


async updateCashback(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-cashback`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


async updateServiceCharge(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-service-charge`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


async updateLoyaltyPoints(payload: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-loyalty-points`,
    headers: this.getAuthHeaders(),
    data: payload
  });

  return res.data;
}


// Vendors
async createVendor(data: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/create-vendor`,
    headers: this.getAuthHeaders(),
    data
  });

  return res.data;
}


async updateVendor(id: number, data: any) {
  const res = await Http.request({
    method: 'POST',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/update-vendor/${id}`,
    headers: this.getAuthHeaders(),
    data
  });

  return res.data;
}


async deleteVendor(id: number) {
  const res = await Http.request({
    method: 'DELETE',
    url: `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/delete-vendor/${id}`,
    headers: this.getAuthHeaders()
  });

  return res.data;
}


}
