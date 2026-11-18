import { Routes } from '@angular/router';
import { Layout } from './shared/presentation/views/layout/layout';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'iam/sign-in',
  },
  {
    path: 'iam',
    loadChildren: () => import('./iam/presentation/iam.routes').then((m) => m.IAM_ROUTES),
  },
  {
    path: '',
    component: Layout,
    children: [
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
    ],
  },
  {
    path: '**',
    redirectTo: 'iam/sign-in',
  },
];
