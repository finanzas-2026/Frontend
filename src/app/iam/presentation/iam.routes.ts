import { Routes } from '@angular/router';

/**
 * Public IAM routes. They render outside `Layout`, as authentication pages
 * must not depend on an authenticated shell.
 */
export const IAM_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./pages/sign-in/sign-in').then((m) => m.SignInPage),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./pages/sign-up-store/sign-up-store').then(
        (m) => m.SignUpStorePage
      ),
  },
];
