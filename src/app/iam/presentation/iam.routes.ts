import { Routes } from '@angular/router';

export const IAM_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./pages/sign-in/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'tenants',
    loadComponent: () =>
      import('./pages/tenant-management/tenant-management.page').then(
        (m) => m.TenantManagementPage
      ),
  },
];
