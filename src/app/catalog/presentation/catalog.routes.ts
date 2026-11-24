import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'products/new',
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'products/:id/edit',
    loadComponent: () =>
      import('./pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'inventory',
    pathMatch: 'full',
    redirectTo: 'products',
  },
];
