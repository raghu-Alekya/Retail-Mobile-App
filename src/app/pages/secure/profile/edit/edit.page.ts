import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CapacitorHttp } from '@capacitor/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
    selector: 'app-edit',
    templateUrl: './edit.page.html',
    styleUrls: ['./edit.page.scss'],
    standalone: false
})
export class EditPage implements OnInit {

  noEmojiValidator(control: AbstractControl): ValidationErrors | null {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

  return emojiRegex.test(control.value || '')
    ? { emojiNotAllowed: true }
    : null;
}

  editForm!: FormGroup;
  wpUrl = 'https://merchantretail.alektasolutions.com';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.editForm = this.fb.group({
  first_name: ['', [this.noEmojiValidator]],
  last_name: ['', [this.noEmojiValidator]],
  username: [{ value: '', disabled: true }],
  email: [''],
  gender: [''],
  phone: [
    '',
    [
      Validators.required,
      Validators.pattern(/^[0-9]*$/), // only numbers
      Validators.minLength(10),
      Validators.maxLength(10)
    ]
  ]
});

    this.loadProfile();
  }

  async loadProfile() {
    const res = await this.authService.getProfile();
  
    this.editForm.patchValue({
      first_name: res.first_name,
      last_name: res.lastname,
      username: res.username,
      email: res.email,
      gender: res.gender,
      phone: res.phone
    });
  
    if (res.email) {
      this.editForm.get('email')?.disable();
    }
  }

  async saveProfile() {
    const formData = this.editForm.getRawValue();
  
    const res = await this.authService.updateProfile(formData);
  
    const toast = await this.toastCtrl.create({
      message: res.message,
      duration: 1500,
      color: 'success'
    });
  
    await toast.present();
  
    this.navCtrl.navigateRoot('/tabs/profile');
  }
}