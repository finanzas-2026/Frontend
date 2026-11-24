import { Routes } from '@angular/router';

export const STORES_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  {
    path: 'list',
    loadComponent: () => import('./pages/store-list/store-list').then((m) => m.StoreListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/sign-up-store/sign-up-store').then((m) => m.SignUpStorePage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/store-form/store-form').then((m) => m.StoreFormPage),
  },
];
