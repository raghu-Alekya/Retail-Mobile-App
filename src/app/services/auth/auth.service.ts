import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import axios from 'axios';
import { AssetsService } from '../assets/assets.service';
import { ApiConfigService } from '../api-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$: Observable<any | null> = this.currentUserSubject.asObservable();
  private base = '';
  private wpBase = '';
  constructor(
    private assetsService: AssetsService,
    private apiConfig: ApiConfigService
  ) {
    this.wpBase = localStorage.getItem('wp_base_url');
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

    // 🔥 Set base URL immediately
    this.apiConfig.setBaseUrl(siteUrl);

    const baseUrl = this.apiConfig.getBaseUrl();
    this.wpBase = this.apiConfig.getBaseUrl();
    const res = await axios.post(
      `${baseUrl}/wp-json/pinaka-pos/v1/token/email`,
      { email, password }
    );

    const token = res.data.data.token;

    localStorage.setItem('wc_token', token);
    localStorage.setItem('user_data', JSON.stringify(res.data.data));
    this.currentUserSubject.next(res.data.data);

    // 🔥 Load assets after token + base URL exist
    await this.assetsService.loadAssets();

    return res.data;
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
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/orders/order-counts-for-admin-app`,
      {
        params: { status },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data ?? 0; // 👈 number
  }

   async getOrders(page: number, search: string = '') {
      const token = localStorage.getItem('wc_token');

      const res = await axios.get(
        `${this.wpBase}/wp-json/wc/v3/orders`,
        {
          params: {
            page,
            per_page: 10,
            orderby: 'date',
            order: 'desc',
            search: search || undefined
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.data;
    }

  // async getOrderById(id: number) {
  //   const res = await axios.get(`${this.wpBase}/${id}`, {
  //     headers: this.getHeaders()
  //   });
  //   return res.data;
  // }

  // async updateOrder(id: number, payload: any) {
  //   const res = await axios.put(`${this.wpBase}/${id}`, payload, {
  //     headers: this.getHeaders()
  //   });
  //   return res.data;
  // }


  async getProducts(page: number, search: string = '', stock: string = '') {  
    const token = localStorage.getItem('wc_token');
    
    const res = await axios.get(
      `${this.wpBase}/wp-json/wc/v3/products`,
      {
        params: {
          page,
          per_page: 10,
          search: search || undefined,
          stock_status: stock || undefined
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.data;
  }

  async createProduct(product: any) {
    const token = localStorage.getItem('wc_token');
    
    const res = await axios.post(
      `${this.wpBase}/wp-json/wc/v3/products`,
      product,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data;
  }
  
  async updateProduct(id: number, product: any) {
    const token = localStorage.getItem('wc_token');
    const res = await axios.put(
      `${this.wpBase}/wp-json/wc/v3/products/${id}`,
      product,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data;
  }
  
  async deleteProduct(id: number) {
    const token = localStorage.getItem('wc_token');
    const res = await axios.delete(
      `${this.wpBase}/wp-json/wc/v3/products/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          force: true
        }
      }
    );
    return res.data;
  }

  async getProductById(id: number){
    const token = localStorage.getItem('wc_token');
    const res = await axios.get(
      `${this.wpBase}/wp-json/wc/v3/products/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          force: true
        }
      }
    );
    return res.data;
  }

  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(
      `${this.wpBase}/wp-json/wp/v2/media`,
      formData,
      {
        headers: {
          ...this.getAuthHeaders(), // Authorization only
        },
      }
    );

    return res.data;
  }


  async getCategories( page = 1, perPage = 100){ 
    const res = await axios.get(
      `${this.wpBase}/wp-json/wc/v3/products/categories`,
      {
        headers: this.getAuthHeaders(),
        params: {
          page,
          per_page: perPage
        }
      }
    );
    return res.data;
  }

  async getTags(){
    const res = await axios.get(
      `${this.wpBase}/wp-json/wc/v3/products/tags`,
      { headers: this.getAuthHeaders() }
    );
    return res.data;
  }

  async createUser(newUser: any){
    const res = await axios.post(`${this.base}/users`, newUser, {
      headers: this.getAuthHeaders(),
    });
    return res.data;
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
    context: 'edit',
  };

  // Search
  if (search) {
    params.search = search;
  }

  // Role filter from dropdown
  if (role) {
    params.role = role;
  }

  // Customer / Employee base filter
  if (userRole === 'customer') {
    params.role = 'customer';
  } 
  else if (userRole === 'employee') {
    params.role__not_in = ['customer'];
  }
  const res = await axios.get(`${this.wpBase}/users`, {
    headers: this.getAuthHeaders(),
    params,
  });

  return {
    users: res.data,
    totalPages: Number(res.headers['x-wp-totalpages'] || 1),
  };
}


  async createUserWithMeta(user: any) {
    console.log('Creating user with data:', user);
    const res = await axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/users/create-user-with-meta`,
      {
        username: user.username,
        email: user.email,
        password: user.password,
        roles: [user.role],
        first_name: user.first_name,
        last_name: user.last_name,
        description: user.phone,
        meta: {
          emp_login_pin: user.emp_login_pin,
        },
      },
      { headers: this.getAuthHeaders() }
    );

    return res.data;
  }

  async getCustomRoles() {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/orders/custom-user-roles`,
      { headers: this.getAuthHeaders() }
    );
    return res.data;
  }

  async updateUser(id: number, data: any) {
    console.log('Updating user with data:', data);
    const res = await axios.put(`${this.wpBase}/wp-json/pinaka-pos/v1/users/update-user-with-meta/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return res.data;
  }

  async deleteUser(id: number) {
    const res = await axios.delete(
      `${this.base}/users/${id}`,
      {
        params: {
          force: true,
          reassign: 0,   // ✅ required
        },
        headers: this.getAuthHeaders(),
      }
    );

    return res.data;
  }

  async getShifts(page: number, search = '', status = '') {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/shifts/get-all-shifts`,
      {
        params: {
          page,
          perPage: 10,
          search,
          status,
        },
        headers: this.getAuthHeaders(),
      }
    );

    return res.data;
  }

  async getOrderPayments(
    page: number,
    search = '',
    status = ''
  ) {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/payments/get-all-paments-for-admin`,
      {
        params: {
          page,
          per_page: 10,
          search,
          status,
        },
        headers: this.getAuthHeaders(),
      }
    );

    return res.data; // { data, pagination }
  }

   // List Media
  async getMedia(page = 1, perPage = 20) {
    return axios.get(
      `${this.wpBase}/wp-json/wp/v2/media?page=${page}&per_page=20`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Update Media (title / alt)
  async updateMedia(id: number, data: any) {
    return axios.post(
      `${this.wpBase}/wp-json/wp/v2/media/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  // Delete Media
  async deleteMedia(id: number) {
    return axios.delete(
      `${this.wpBase}/wp-json/wp/v2/media/${id}?force=true`,
      { headers: this.getAuthHeaders() }
    );
  } 

  async getVendors(page = 1, perPage = 10) {
    return axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/get-all-vendors-for-admin`,
      {
        headers: this.getAuthHeaders(),
        params: {
          page,
          per_page: perPage
        }
      }
    );
  }

  getAttributes() {
    return axios.get(
      `${this.wpBase}/wp-json/wc/v3/products/attributes`,
      { headers: this.getAuthHeaders() }
    );
}

getAttributeTerms(attributeId: number) {
    return axios.get(
      `${this.wpBase}/wp-json/wc/v3/products/attributes/${attributeId}/terms`,
      { headers: this.getAuthHeaders() }
    );
  //return this.get(`/wp-json/wc/v3/products/attributes/${attributeId}/terms`);
}

createVariation(productId: number, data: any) {
  return axios.post(
    `${this.wpBase}/wp-json/wc/v3/products/${productId}/variations`,
    data,
    { headers: this.getAuthHeaders() }
  );
}

  // In auth.service.ts - WooCommerce Customer Creation
async createWooCommerceCustomer(customerData: any) {
  const url = `${this.wpBase}/wp-json/wc/v3/customers`;
  
  // WooCommerce expects specific structure
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
    const response = await axios.post(url, payload, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
}

// Optional: Get customer roles if needed
async getCustomerRoles() {
  // WooCommerce typically uses 'customer' role
  // You might want to get this from WordPress roles endpoint
  const url = `${this.wpBase}/wp-json/wp/v2/users/roles`;
  
  try {
    const response = await axios.get(url, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Get roles error:', error);
    return [];
  }
}

async getDailySales(startDate: string, endDate: string) {
  const res = await axios.get(
    `${this.wpBase}/wp-json/wc/v3/orders`,
    {
      params: {
        after: `${startDate}T00:00:00`,
        before: `${endDate}T23:59:59`,
        per_page: 100,
        status: 'completed'
      },
      headers: this.getAuthHeaders()
    }
  );
  return res.data;
}

async loadSales(date: string) {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/reports/sales`,
      {
        params: { date: date },
        headers: this.getAuthHeaders()
      }
    );
    return res.data;
  }
  async loadShiftSales(date?: string) {

    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/reports-new/shift-sales`,
      {
        params: date ? { date: date } : {},
        headers: this.getAuthHeaders()
      }
    );

    return res.data;
  }
  async loadEmployeeSales(date: string) {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/reports/employee-sales`,
      {
        params: { date: date },
        headers: this.getAuthHeaders()
      }
    );
    return res.data;
  }

  async loadItemSales(date: string) {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/reports/item-sales`,
      {
        params: { date: date },
        headers: this.getAuthHeaders()
      }
    );
    return res.data;
  }

  async loadInventory(date: string, page = 1, per_page = 50) {
    const res = await axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/reports/inventory`,
      {
        params: { date, page, per_page },
        headers: this.getAuthHeaders()
      }
    );
    return res.data;
  }

  getCoupons() {
    return axios.get(
      `${this.wpBase}/wp-json/wc/v3/coupons`,
      { headers: this.getAuthHeaders() }
    ).then(r => r.data);
  }

  createCoupon(data: any) {
    return axios.post(
      `${this.wpBase}/wp-json/wc/v3/coupons`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  updateCoupon(id: number, data: any) {
    return axios.put(
      `${this.wpBase}/wp-json/wc/v3/coupons/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteCoupon(id: number) {
    return axios.delete(
      `${this.wpBase}/wp-json/wc/v3/coupons/${id}?force=true`,
      { headers: this.getAuthHeaders() }
    );
  }

  getCashSettings() {
    return axios.get(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/cash-settings`, {
      headers: this.getAuthHeaders()
    });
  }

  saveCashSettings(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/cash-settings`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  saveDenominations(type: string, payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/denominations/${type}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  forgotPassword(email: string) {
    return axios.post<any>(
      `${this.wpBase}/wp-json/pinaka/v1/forgot-password`,
      { email }
    );
  }


  async getDiscounts(page = 1, perPage = 10) {
    return axios.get(
      `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/get-all-discounts-for-admin`,
      {
        headers: this.getAuthHeaders(),
        params: {
          page,
          per_page: perPage
        }
      }
    );
  }

  async createDiscount(data: any) {
    return axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/create-discount`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  async updateDiscount(id: number, data: any) {
    data.discount_id = id; // include ID in payload
    return axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/update-discount/`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }
  async getProductsByIds(ids: number[], data: any = {}) {
    return axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/by-ids`,
      { 
        ...data,
        ids: ids 
      } ,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  searchProducts(term: string) {
    return axios.get(
      `${this.wpBase}/wp-json/wc/v3/products?search=${encodeURIComponent(term)}`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }
  // async deleteDiscount(id: number) {
  //   return axios.delete(
  //     `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/delete-discount/${id}`,
  //     { headers: this.getAuthHeaders() }
  //   );
  // }
  async deleteDiscount(id: number,type: string, data: any = {}) {
    return axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/custom-discount/delete-discount`,
      {
        ...data,
        id: id,
        type : type
      },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  async saveBussinessInfo(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/business-info`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async enableTaxes(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-taxes`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async enableCoupons(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-coupons`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async sequentialCoupons(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/sequential-coupons`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async saveCategory(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/wc/v3/products/categories`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async deleteCategory(id: number) {
    return axios.delete(`${this.wpBase}/wp-json/wc/v3/products/categories/${id}`, {
      headers: this.getAuthHeaders(),
      params: { force: true }
    });
  }

  async updateEnableSafes(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-safes`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async updateEnableSafesDrop(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-safes-drop`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async updateCashback(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-cashback`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async updateServiceCharge(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-service-charge`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async updateLoyaltyPoints(payload: any) {
    return axios.post(`${this.wpBase}/wp-json/pinaka-pos/v1/settings/enable-loyalty-points`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  async createVendor(data: any) {
    return axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/create-vendor`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  async updateVendor(id: number, data: any) {
    return axios.post(
      `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/update-vendor/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  async deleteVendor(id: number) {
    return axios.delete(
      `${this.wpBase}/wp-json/pinaka-pos/v1/vendor_payments/delete-vendor/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

}
