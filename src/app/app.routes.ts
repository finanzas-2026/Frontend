import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'financing/simulator',
  },
  {
    path: 'financing',
    loadChildren: () => import('./financing/presentation/financing.routes').then((m) => m.financingRoutes),
  },
  {
    path: 'sales',
    loadChildren: () => import('./sales/presentation/sales.routes').then((m) => m.SALES_ROUTES),
  },
  {
    path: 'settlements',
    loadChildren: () => import('./settlements/presentation/settlements.routes').then((m) => m.SETTLEMENTS_ROUTES),
  },
  {
    path: 'analytics',
    loadChildren: () => import('./analytics/presentation/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
  },
];
