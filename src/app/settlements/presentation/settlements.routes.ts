import { Routes } from '@angular/router';
import { UserRoles } from '../../iam/domain/constants/user-roles.constant';
import { roleGuard } from '../../iam/presentation/guards/role.guard';

export const SETTLEMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'desk',
  },
  {
    path: 'desk',
    canActivate: [roleGuard(UserRoles.STORE_ADMIN)],
    loadComponent: () =>
      import('./pages/collection-desk/collection-desk.component').then(
        (m) => m.CollectionDeskPageComponent
      ),
  },
  {
    path: 'list',
    canActivate: [roleGuard(UserRoles.STORE_ADMIN)],
    loadComponent: () =>
      import('./pages/settlements-list/settlements-list.component').then(
        (m) => m.SettlementsListPageComponent
      ),
  },
  {
    path: 'portal',
    canActivate: [roleGuard(UserRoles.CUSTOMER)],
    loadComponent: () =>
      import('./pages/customer-portal/customer-portal.component').then(
        (m) => m.CustomerPortalPageComponent
      ),
  },
];
