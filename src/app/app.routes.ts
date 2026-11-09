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
];
