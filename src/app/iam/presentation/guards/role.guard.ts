import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/stores/auth.store';
import { UserRole } from '../../domain/constants/user-roles.constant';

/**
 * Allows navigation only for the roles explicitly authorized by the route.
 *
 * It assumes `authGuard` runs first; if there is no session, it redirects to
 * sign-in anyway. Unauthorized roles are sent to a safe authenticated route.
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/iam/sign-in'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const role = authStore.currentRole();
    if (role !== null && allowedRoles.includes(role)) {
      return true;
    }

    return router.createUrlTree(['/financing/simulator']);
  };
}
