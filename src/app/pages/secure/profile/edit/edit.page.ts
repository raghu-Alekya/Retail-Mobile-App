import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ToastController, NavController } from '@ionic/angular';
import { LOCATIONS } from 'src/app/data/locations';
 
@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
  standalone: false
})
export class EditPage implements OnInit {
  editForm!: FormGroup;
  initialValues: any = null;
 
  // Dropdown state
  activeDropdown: 'country' | 'state' | 'city' | null = null;
  searchQuery = '';
  allItems: string[] = [];
  filteredItems: string[] = [];
 
  noEmojiValidator(control: AbstractControl): ValidationErrors | null {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    return emojiRegex.test(control.value || '') ? { emojiNotAllowed: true } : null;
  }
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {}
 
  ngOnInit() {
    this.editForm = this.fb.group({
      first_name: ['', [Validators.required, this.noEmojiValidator]],
      last_name: ['', [Validators.required, this.noEmojiValidator]],
      email: [{ value: '', disabled: true }],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]*$/),
          Validators.minLength(10),
          Validators.maxLength(10)
        ]
      ],
      address_line1: ['', [Validators.required]],
      address_line2: [''],
      country: ['', [Validators.required]],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postal_code: ['', [Validators.required]]
    });
 
    this.loadProfile();
  }
 
  async loadProfile() {
    try {
      const res = await this.authService.getProfile();
      const data = res?.merchant || res;
 
      const values = {
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: data.email || data.merchantEmail || '',
        phone: data.phone || data.merchantPhoneNumber || '',
        address_line1: data.address_line1 || data.addressLine1 || '',
        address_line2: data.address_line2 || data.addressLine2 || '',
        country: data.country || '',
        state: data.state || '',
        city: data.city || '',
        postal_code: data.postal_code || data.postalCode || data.pinCode || ''
      };
 
      this.editForm.patchValue(values);
      this.initialValues = values;
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  }
 
  hasChanges(): boolean {
    if (!this.initialValues || !this.editForm) return false;
    const current = this.editForm.getRawValue();
    return Object.keys(this.initialValues).some(
      key => key !== 'email' && (current[key] ?? '') !== (this.initialValues[key] ?? '')
    );
  }
 
  async toggleDropdown(type: 'country' | 'state' | 'city') {
    if (this.activeDropdown === type) {
      this.closeDropdown();
      return;
    }
 
    const countryVal = (this.editForm.get('country')?.value || '').trim();
    const stateVal = (this.editForm.get('state')?.value || '').trim();
 
    if (type === 'state' && !countryVal) {
      const toast = await this.toastCtrl.create({
        message: 'Please select a country first',
        duration: 1500,
        color: 'warning'
      });
      await toast.present();
      return;
    }
 
    if (type === 'city' && !stateVal) {
      const toast = await this.toastCtrl.create({
        message: 'Please select a state first',
        duration: 1500,
        color: 'warning'
      });
      await toast.present();
      return;
    }
 
    this.activeDropdown = type;
    this.searchQuery = '';
 
    if (type === 'country') {
      this.allItems = LOCATIONS.map(c => c.name).sort((a, b) => a.localeCompare(b));
    } else if (type === 'state') {
      const countryObj = LOCATIONS.find(c => c.name.toLowerCase() === countryVal.toLowerCase());
      this.allItems = countryObj ? countryObj.states.map(s => s.name).sort((a, b) => a.localeCompare(b)) : [];
    } else if (type === 'city') {
      const countryObj = LOCATIONS.find(c => c.name.toLowerCase() === countryVal.toLowerCase());
      const stateObj = countryObj?.states.find(s => s.name.toLowerCase() === stateVal.toLowerCase());
      this.allItems = stateObj ? [...stateObj.cities].sort((a, b) => a.localeCompare(b)) : [];
    }
 
    this.filteredItems = [...this.allItems];
  }
 
  filterItems() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredItems = [...this.allItems];
      return;
    }
    this.filteredItems = this.allItems.filter(item =>
      item.toLowerCase().includes(q)
    );
  }
 
  closeDropdown() {
    this.activeDropdown = null;
    this.searchQuery = '';
    this.filteredItems = [];
    this.allItems = [];
  }
 
  selectItem(value: string) {
    if (!value || !this.activeDropdown) return;
 
    if (this.activeDropdown === 'country') {
      if (this.editForm.get('country')?.value !== value) {
        this.editForm.patchValue({
          country: value,
          state: '',
          city: ''
        });
        this.editForm.get('country')?.markAsDirty();
      }
    } else if (this.activeDropdown === 'state') {
      if (this.editForm.get('state')?.value !== value) {
        this.editForm.patchValue({
          state: value,
          city: ''
        });
        this.editForm.get('state')?.markAsDirty();
      }
    } else if (this.activeDropdown === 'city') {
      if (this.editForm.get('city')?.value !== value) {
        this.editForm.patchValue({ city: value });
        this.editForm.get('city')?.markAsDirty();
      }
    }
 
    this.closeDropdown();
  }
 
  async saveProfile() {
    if (this.editForm.invalid || !this.hasChanges()) return;
 
    try {
      const formData = this.editForm.getRawValue();
      const res = await this.authService.updateProfile(formData);
 
      const toast = await this.toastCtrl.create({
        message: res?.message || 'Profile updated successfully',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
 
      this.initialValues = formData;
      this.navCtrl.navigateRoot('/tabs/profile');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Failed to update profile',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}