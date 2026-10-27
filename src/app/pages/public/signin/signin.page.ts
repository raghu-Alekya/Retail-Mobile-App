import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Router } from '@angular/router';


@Component({
    selector: 'app-signin',
    templateUrl: './signin.page.html',
    styleUrls: ['./signin.page.scss'],
    standalone: false
})
export class SigninPage implements OnInit {

  current_year: number = new Date().getFullYear();

  signin_form: FormGroup;
  submit_attempt: boolean = false;
  showPassword = false;
  error = '';
  loading = false;
  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit() {
    // Setup form
    this.signin_form = this.formBuilder.group({
      email: ['', Validators.compose([Validators.email, Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });

  }

  // Sign in
  async signIn() {
    if (this.loading) return;
    this.submit_attempt = true;

    if (this.signin_form.invalid) {
      this.toastService.presentToast(
        'Error',
        'Please enter valid email and password',
        'top',
        'danger',
        2000
      );
      return;
    }

    this.loading = true;
    const loading = await this.loadingController.create({
      cssClass: 'default-loading',
      message: 'Signing in...\nPlease be patient.',
      spinner: 'crescent'
    });

    await loading.present();

    try {
      await this.authService.loginMerchant(
        this.signin_form.value.email,
        this.signin_form.value.password
      );

      await this.router.navigateByUrl('tabs/home', { replaceUrl: true });

    } catch (error: any) {
      this.toastService.presentToast(
        'Login Failed',
        error?.message?.includes('fetch')
          ? 'Cannot reach PCH. Check that the backend is running on port 3003.'
          : error?.message || 'Unable to sign in. Please try again.',
        'top',
        'danger',
        2000
      );
    } finally {
      loading.dismiss();
      this.loading = false;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
