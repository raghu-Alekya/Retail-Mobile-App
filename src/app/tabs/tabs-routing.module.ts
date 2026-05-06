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
        path: 'charts',
        loadChildren: () => import('../pages/secure/reports/reports.module').then(m => m.ReportsPageModule)
      },
      {
        path: 'payments',
        loadChildren: () => import('../pages/secure/order-payments/order-payments.module').then(m => m.OrderPaymentsPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../pages/secure/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'editprofile',
        loadChildren: () => import('../pages/secure/profile/edit/edit.module').then(m => m.EditPageModule)
      },
      {
        path: 'change-password',
        loadChildren: () => import('../pages/secure/change-password/change-password.module').then(m => m.ChangePasswordPageModule),
      },

      // ✅🔥 ADD THIS (VERY IMPORTANT)
      {
        path: 'coupons',
        loadChildren: () =>
          import('../pages/secure/coupons/coupons.module').then(
            m => m.CouponsPageModule
          )
      },

      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}