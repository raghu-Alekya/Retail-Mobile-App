import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';

interface DeviceItem {
  id: string;
  store_id?: string;
  device_id?: string;
  merchant_id?: string;
  device_name: string;
  device_type: string;
  status: string;
  [key: string]: any;
}

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: false
})
export class DevicesPage implements OnInit {
  devices: DeviceItem[] = [];
  filteredDevices: DeviceItem[] = [];
  searchQuery: string = '';
  loading: boolean = false;
  loadError: string = '';

  private readonly apiUrl = 'https://pch.alektasolutions.com/connector/api/v1/store-device-mappings';
  private readonly defaultStoreId = '5066038f-0e26-40f5-a4bf-44a1bdd300ac';
  private readonly defaultToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYzI4NjdkMi0zZGZhLTRlNDEtYTRhYi0xNDYwOGQ0ZjEwOTUiLCJhY2NvdW50SWQiOm51bGwsImVtYWlsIjoiYWthc2hAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsIm1lcmNoYW50SWQiOiJjZTdlOTVhMy01ZGQzLTQwNjMtYWYwMy0yNTE4MjVjOWEyZDkiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiZmU1ZjIxYmUtZjY1OS00NzYyLTg4ZDYtODY3ZmY0YWVhMzk2IiwiaWF0IjoxNzkzMjYzNjc2LCJleHAiOjE3OTU4NTU2NzZ9.b0llDi1kGhRcwmfJ6Px-Jz00332_KBdvtFYSb1-IvCk';

  constructor(private toastCtrl: ToastController) {}

  ngOnInit() {
    this.loadDevices();
  }

  ionViewWillEnter() {
    if (this.devices.length === 0) {
      this.loadDevices();
    }
  }

  async loadDevices() {
    this.loading = true;
    this.loadError = '';

    try {
      let storeId = this.defaultStoreId;
      try {
        const selectedStore = JSON.parse(localStorage.getItem('selected_store') || 'null');
        if (selectedStore?.id) {
          storeId = selectedStore.id;
        }
      } catch {}

      const url = `${this.apiUrl}?store_id=${encodeURIComponent(storeId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.defaultToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load devices (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        this.devices = data;
      } else if (data && Array.isArray(data.devices)) {
        this.devices = data.devices;
      } else {
        this.devices = [];
      }
      this.applyFilter();
    } catch (error: any) {
      console.warn('Devices API fetch failed, using fallback data:', error);
      // Fallback data matching API schema
      this.devices = [
        {
          id: '669892dc-9ce8-401c-88ae-f9f0bfd616ff',
          device_name: 'scanner',
          device_type: 'Barcode Scanner',
          status: 'ACTIVE'
        },
        {
          id: 'af17f893-6c87-418c-b91f-b36f34e083b1',
          device_name: 'Thermal Printer',
          device_type: 'Receipt Printer',
          status: 'ACTIVE'
        },
        {
          id: '303b547c-82fe-4822-b00f-7199beec6ba8',
          device_name: 'POS Terminal 011',
          device_type: 'POS Terminal',
          status: 'INACTIVE'
        },
        {
          id: '7fdb9d45-fcfc-48f8-9d5c-02074cbac4d4',
          device_name: 'Sunmi POS',
          device_type: 'POS Terminal',
          status: 'ACTIVE'
        }
      ];
      this.applyFilter();
    } finally {
      this.loading = false;
    }
  }

  onSearch(event: any) {
    this.searchQuery = event?.target?.value || '';
    this.applyFilter();
  }

  applyFilter() {
    const query = (this.searchQuery || '').trim().toLowerCase();
    if (!query) {
      this.filteredDevices = [...this.devices];
    } else {
      this.filteredDevices = this.devices.filter(device =>
        (device.device_name || '').toLowerCase().includes(query)
      );
    }
  }

  async openAddDevice() {
    const toast = await this.toastCtrl.create({
      message: 'Add device feature coming soon',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
