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
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      site_url: ['', Validators.compose([Validators.required])]
    });
    // DEBUG: Prefill inputs
    this.signin_form.get('email').setValue('vijay.nadipineni@alekyatechsolutions.com');
    this.signin_form.get('password').setValue('Retail@1234$');
    this.signin_form.get('site_url').setValue('merchantretail.alektasolutions.com');
  }

  // Sign in
  async signIn() {
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

    const loading = await this.loadingController.create({
      cssClass: 'default-loading',
      message: '<p>Signing in...</p><span>Please be patient.</span>',
      spinner: 'crescent'
    });

    await loading.present();

    try {
      // 🔥 IMPORTANT: await login
      const res = await this.authService.login(
        this.signin_form.value.email,
        this.signin_form.value.password,
        this.signin_form.value.site_url
      );

      // Optional safety check
      const token = localStorage.getItem('wc_token');

      if (!token) {
        throw new Error('Token not stored');
      }
      console.log(token);
      // ✅ Navigate ONLY after token exists
      await this.router.navigateByUrl('tabs/home', { replaceUrl: true });

    } catch (error) {
      this.toastService.presentToast(
        'Login Failed',
        'Invalid email or password',
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
