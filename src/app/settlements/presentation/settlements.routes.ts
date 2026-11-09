import { Routes } from '@angular/router';

export const SETTLEMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'desk',
  },
  {
    path: 'desk',
    loadComponent: () =>
      import('./pages/collection-desk/collection-desk.component').then(
        (m) => m.CollectionDeskPageComponent
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./pages/settlements-list/settlements-list.component').then(
        (m) => m.SettlementsListPageComponent
      ),
  },
  {
    path: 'portal',
    loadComponent: () =>
      import('./pages/customer-portal/customer-portal.component').then(
        (m) => m.CustomerPortalPageComponent
      ),
  },
];
