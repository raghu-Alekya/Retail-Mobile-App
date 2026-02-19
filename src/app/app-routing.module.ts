import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PublicGuard } from './guards/public.guard';
 
const routes: Routes = [
 
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
    {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard]
  },
 
 
  // 🔐 Secure home
  // {
  //   path: '',
  //   redirectTo: 'home',
  //   pathMatch: 'full'
  // },
 
  // {
  //   path: 'home',
  //   loadChildren: () =>
  //     import('./pages/secure/home/home.module').then(m => m.HomePageModule),
  //   canActivate: [AuthGuard]
  // },
 
  // 🔓 Public pages
  {
    path: 'welcome',
    loadChildren: () =>
      import('./pages/public/welcome/welcome.module').then(m => m.WelcomePageModule),
    canActivate: [PublicGuard]
  },
  {
    path: 'signin',
    loadChildren: () =>
      import('./pages/public/signin/signin.module').then(m => m.SigninPageModule),
    canActivate: [PublicGuard]
  },
  {
    path: 'signup',
    loadChildren: () =>
      import('./pages/public/signup/signup.module').then(m => m.SignupPageModule),
    canActivate: [PublicGuard]
  },
  {
    path: 'password-reset',
    loadChildren: () =>
      import('./pages/public/password-reset/password-reset.module')
        .then(m => m.PasswordResetPageModule),
    canActivate: [PublicGuard]
  },
 
  // 🔐 Other secure pages
  {
    path: 'orders-list',
    loadChildren: () =>
      import('./pages/secure/orders-list/orders-list.module')
        .then(m => m.OrdersListPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'products-list',
    loadChildren: () =>
      import('./pages/secure/products-list/products-list.module')
        .then(m => m.ProductsListPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'products/add',
    loadChildren: () =>
      import('./pages/secure/product-form/product-form.module')
        .then(m => m.ProductFormPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'products/edit/:id',
    loadChildren: () =>
      import('./pages/secure/product-form/product-form.module')
        .then(m => m.ProductFormPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'users/customers',
    loadChildren: () =>
      import('./pages/secure/users-list/users-list.module')
        .then(m => m.UsersListPageModule),
     canActivate: [AuthGuard]
  },
  {
    path: 'users/employees',
    loadChildren: () =>
      import('./pages/secure/users-list/users-list.module')
        .then(m => m.UsersListPageModule),
     canActivate: [AuthGuard]
  },
  {
    path: 'shifts',
    loadChildren: () =>
      import('./pages/secure/shifts/shifts.module')
        .then(m => m.ShiftsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'payments',
    loadChildren: () =>
      import('./pages/secure/payments/payments.module')
        .then(m => m.PaymentsPageModule),
    canActivate: [AuthGuard]  
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./pages/secure/reports/reports.module')
        .then(m => m.ReportsPageModule),
    canActivate: [AuthGuard]
  },
  { path: "order-payments",
    loadChildren: () => import("./pages/secure/order-payments/order-payments.module").then(m => m.OrderPaymentsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'media',
    loadChildren: () =>
      import('./pages/secure/media/media.module')
        .then(m => m.MediaPageModule),
    canActivate: [AuthGuard]
  },
  { path: "vendors",
    loadChildren: () => import("./pages/secure/vendors/vendors.module").then(m => m.VendorsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path : 'coupons',
    loadChildren: () =>
      import('./pages/secure/coupons/coupons.module')
        .then(m => m.CouponsPageModule),
    canActivate: [AuthGuard]  
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./pages/secure/settings/settings.module')
        .then(m => m.SettingsPageModule),
    canActivate: [AuthGuard]  
  },
  {
    path: 'pos-settings',
    loadChildren: () =>
      import('./pages/secure/pos-settings/pos-settings.module')
        .then(m => m.PosSettingsPageModule),
    canActivate: [AuthGuard]  
  },
  {
    path: 'discounts',
    loadChildren: () =>
      import('./pages/secure/discounts/discounts.module')
        .then(m => m.DiscountsPageModule),
    canActivate: [AuthGuard]  
  },
  // {
  //   path: 'devices',
  //   loadChildren: () =>
  //     import('./pages/secure/settings/devices/devices.module').then(m => m.DevicesPageModule)
 
  //   },
  {
  path: 'secure',
  loadChildren: () =>
    import('./pages/secure/secure.module')
      .then(m => m.SecureModule)
}
 
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }