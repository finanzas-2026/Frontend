import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'analytics/dashboard',
  },
  {
    path: 'analytics',
    children: [],
  },
];
