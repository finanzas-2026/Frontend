import { Routes } from '@angular/router';
import { UserRoles } from './iam/domain/constants/user-roles.constant';
import { authGuard } from './iam/presentation/guards/auth.guard';
import { roleGuard } from './iam/presentation/guards/role.guard';
import { Layout } from '@shared';

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
    canActivate: [
      authGuard,
      roleGuard(
        UserRoles.SUPER_ADMIN,
        UserRoles.STORE_ADMIN,
        UserRoles.CUSTOMER
      ),
    ],
    children: [
      {
        path: 'stores',
        canActivate: [roleGuard(UserRoles.SUPER_ADMIN)],
        loadChildren: () =>
          import('./iam/presentation/stores.routes').then((m) => m.STORES_ROUTES),
      },
      {
        path: 'catalog',
        canActivate: [roleGuard(UserRoles.STORE_ADMIN)],
        loadChildren: () =>
          import('./catalog/presentation/catalog.routes').then(
            (m) => m.CATALOG_ROUTES
          ),
      },
      {
        path: 'credit',
        canActivate: [roleGuard(UserRoles.STORE_ADMIN)],
        loadChildren: () =>
          import('./credit/presentation/credit.routes').then(
            (m) => m.CREDIT_ROUTES
          ),
      },
      {
        path: 'financing',
        canActivate: [roleGuard(UserRoles.STORE_ADMIN, UserRoles.CUSTOMER)],
        loadChildren: () => import('./financing/presentation/financing.routes').then((m) => m.financingRoutes),
      },
      {
        path: 'sales',
        canActivate: [roleGuard(UserRoles.STORE_ADMIN)],
        loadChildren: () => import('./sales/presentation/sales.routes').then((m) => m.SALES_ROUTES),
      },
      {
        path: 'settlements',
        loadChildren: () => import('./settlements/presentation/settlements.routes').then((m) => m.SETTLEMENTS_ROUTES),
      },
      {
        path: 'analytics',
        canActivate: [roleGuard(UserRoles.STORE_ADMIN)],
        loadChildren: () => import('./analytics/presentation/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'iam/sign-in',
  },
];
