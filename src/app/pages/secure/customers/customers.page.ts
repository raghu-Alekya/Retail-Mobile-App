import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
})
export class CustomersPage implements OnInit {

  customers: any[] = [];
  filteredCustomers: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
  const response = await this.authService.getUsers('customer', 1, 50);

  this.customers = (response.users || []).filter(user =>
    user.roles.length === 1 &&
    user.roles.includes('customer')
  );

  this.filteredCustomers = [...this.customers];
}
  onSearch(event: any) {
    const value = event.target.value.toLowerCase();

    this.customers = this.filteredCustomers.filter(user =>
      user.email?.toLowerCase().includes(value) ||
      user.meta?.phone?.includes(value)
    );
  }
}