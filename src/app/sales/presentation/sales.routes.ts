import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pos',
  },
  {
    path: 'pos',
    loadComponent: () =>
      import('./pages/pos-checkout/pos-checkout.component').then(
        (m) => m.PosCheckoutPageComponent
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/sales-history/sales-history.component').then(
        (m) => m.SalesHistoryPageComponent
      ),
  },
];
