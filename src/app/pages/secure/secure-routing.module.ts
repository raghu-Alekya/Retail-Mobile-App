import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./../../tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'styleguide',
    loadChildren: () => import('./styleguide/styleguide.module').then(m => m.StyleguidePageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'settings/profile/edit',
    loadChildren: () => import('./profile/edit/edit.module').then(m => m.EditPageModule)
  },
  {
    path: 'payments/detail',
    loadChildren: () => import('./payments/payment-detail/payment-detail.module').then( m => m.PaymentDetailPageModule)
  },
  {
    path: 'orders-list',
    loadChildren: () => import('./orders-list/orders-list.module').then( m => m.OrdersListPageModule)
  },
  {
    path: 'products-list',
    loadChildren: () => import('./products-list/products-list.module').then( m => m.ProductsListPageModule)
  },
  {
    path: 'product-form',
    loadChildren: () => import('./product-form/product-form.module').then( m => m.ProductFormPageModule)
  },
  {
    path: 'users-list',
    loadChildren: () => import('./users-list/users-list.module').then( m => m.UsersListPageModule)
  },
  {
    path: 'shifts',
    loadChildren: () => import('./shifts/shifts.module').then( m => m.ShiftsPageModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then( m => m.ReportsPageModule)
  },
  {
    path: 'order-payments',
    loadChildren: () => import('./order-payments/order-payments.module').then( m => m.OrderPaymentsPageModule)
  },
  {
    path: 'media',
    loadChildren: () => import('./media/media.module').then( m => m.MediaPageModule)
  },
  {
    path: 'vendors',
    loadChildren: () => import('./vendors/vendors.module').then( m => m.VendorsPageModule)
  },
  {
    path: 'coupons',
    loadChildren: () => import('./coupons/coupons.module').then( m => m.CouponsPageModule)
  },
  {
    path: 'pos-settings',
    loadChildren: () => import('./pos-settings/pos-settings.module').then( m => m.PosSettingsPageModule)
  },
  {
    path: 'discounts',
    loadChildren: () => import('./discounts/discounts.module').then( m => m.DiscountsPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SecureRoutingModule { }
