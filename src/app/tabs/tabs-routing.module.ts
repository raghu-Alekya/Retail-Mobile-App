import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/secure/home/home.module').then(m => m.HomePageModule)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'charts',
        loadChildren: () => import('../pages/secure/reports/reports.module').then(m => m.ReportsPageModule)
      },
      {
        path: 'payments',
        loadChildren: () => import('../pages/secure/order-payments/order-payments.module').then(m => m.OrderPaymentsPageModule)
      },
      {
        path: 'profile',
        loadChildren: () =>import('../pages/secure/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'editprofile',
        loadChildren: () =>import('../pages/secure/profile/edit/edit.module').then(m => m.EditPageModule)
      },
      {
          path: 'change-password',
          loadChildren: () =>import('../pages/secure/change-password/change-password.module').then(m => m.ChangePasswordPageModule),
      },
      {
        path: 'address',
        loadChildren: () =>import('../pages/secure/address/address.module').then(m => m.AddressPageModule)
      },
      {
        path: 'styleguide',
        loadChildren: () => import('../pages/secure/styleguide/styleguide.module').then(m => m.StyleguidePageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule { }