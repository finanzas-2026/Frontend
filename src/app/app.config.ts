import { ApplicationConfig, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpInterceptorFn, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { errorInterceptor } from '@shared';
import { provideFinancing } from '@financing';
import { provideSales } from '@sales';
import { provideSettlements } from '@settlements';
import { provideAnalytics } from '@analytics';

import { AuthStore } from './iam/application/stores/auth.store';
import { ACTIVE_STORE_ID } from './shared/application/active-store.token';
import { environment } from '../environments/environment';

const demoSessionInterceptor: HttpInterceptorFn = (request, next) => {
  if (!environment.demo || !request.url.startsWith(environment.salesCreditBaseApi + '/')) {
    return next(request);
  }
  const session = inject(AuthStore).session();
  return next(session ? request.clone({ setHeaders: { 'X-Demo-User-Id': String(session.userId) } }) : request);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([demoSessionInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    { provide: ACTIVE_STORE_ID, useFactory: () => inject(AuthStore).currentStoreId },
    provideFinancing(),
    provideSales(),
    provideSettlements(),
    provideAnalytics(),
  ],
};
