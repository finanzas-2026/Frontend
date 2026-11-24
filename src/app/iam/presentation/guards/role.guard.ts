import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/stores/auth.store';
import { UserRole, UserRoles } from '../../domain/constants/user-roles.constant';

/**
 * Allows navigation only for the roles explicitly authorized by the route.
 *
 * It assumes `authGuard` runs first; if there is no session, it redirects to
 * sign-in anyway. Unauthorized roles are sent to a safe authenticated route.
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return async (_route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);
    await authStore.initialize();

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/iam/sign-in'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const role = authStore.currentRole();
    if (role !== null && allowedRoles.includes(role)) {
      return true;
    }

    switch (role) {
      case UserRoles.SUPER_ADMIN:
        return router.createUrlTree(['/stores/list']);
      case UserRoles.STORE_ADMIN:
        return router.createUrlTree(['/sales/pos']);
      case UserRoles.CUSTOMER:
        return router.createUrlTree(['/financing/simulator']);
      default:
        return router.createUrlTree(['/iam/sign-in']);
    }
  };
}
