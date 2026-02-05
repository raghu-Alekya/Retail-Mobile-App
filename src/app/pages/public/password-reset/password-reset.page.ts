import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.page.html',
  styleUrls: ['./password-reset.page.scss'],
})

export class PasswordResetPage implements OnInit {

  reset_form: FormGroup;
  current_year: number = new Date().getFullYear();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.reset_form = this.formBuilder.group({
      email: ['', Validators.compose([Validators.email, Validators.required])],
    });
  }

  async resetPassword() {
    if (this.reset_form.invalid) {
      return;
    }

    const email = this.reset_form.value.email;

    try {
      await this.authService.forgotPassword(email);
      this.toast('Reset link sent to your email');
      this.router.navigate(['/signin']);
    } catch (err: any) {
      this.toast(err.error?.message || 'Something went wrong');
    }
  }

  toast(msg: string) {
    this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'bottom'
    }).then(t => t.present());
  }

}
