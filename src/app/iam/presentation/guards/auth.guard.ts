import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/stores/auth.store';

/**
 * Allows navigation only when a session exists; otherwise redirects to sign-in
 * and keeps the requested URL so Presentation can return to it.
 *
 * This protects frontend navigation only, never the backend.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/iam/sign-in'], {
    queryParams: { returnUrl: state.url },
  });
};
