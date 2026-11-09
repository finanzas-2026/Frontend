import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardPageComponent
      ),
  },
  {
    path: 'movements',
    loadComponent: () =>
      import('./pages/movements-audit/movements-audit.component').then(
        (m) => m.MovementsAuditPageComponent
      ),
  },
];
