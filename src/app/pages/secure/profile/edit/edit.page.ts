import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

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
      first_name: [''],
      last_name: [''],
      username: [{ value: '', disabled: true }],
      email: [''],
      gender: [''],
      phone: ['']
    });

    this.loadProfile();
  }

  async loadProfile() {

  const token = this.authService.getToken();

  const res = await Http.request({
    method: 'GET',
    url: `${this.wpUrl}/wp-json/pinaka-pos/v1/profile`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log(res.data);

  this.editForm.patchValue({
    first_name: res.data.first_name,
    last_name: res.data.lastname,
    username: res.data.username,
    email: res.data.email,
    gender: res.data.gender,
    phone: res.data.phone
  });

}

 async saveProfile() {

  const token = this.authService.getToken();

  const res = await Http.request({
    method: 'POST',
    url: `${this.wpUrl}/wp-json/pinaka-pos/v1/profile`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: this.editForm.value
  });

  const toast = await this.toastCtrl.create({
    message: res.data.message,
    duration: 1500,
    color: 'success'
  });

  await toast.present();

  // 🔥 Navigate back after save
  this.navCtrl.navigateRoot('/tabs/profile');
}
}