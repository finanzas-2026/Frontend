import { ApplicationConfig, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { errorInterceptor } from '@shared';
import { provideFinancing } from '@financing';
import { provideSales } from '@sales';
import { provideSettlements } from '@settlements';
import { provideAnalytics } from '@analytics';

import { ACTIVE_STORE_ID } from './shared/application/active-store.token';
import { authTokenInterceptor } from './iam/infrastructure/http/auth-token.interceptor';
import { AuthStore } from './iam/application/stores/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authTokenInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    { provide: ACTIVE_STORE_ID, useFactory: () => inject(AuthStore).currentStoreId },
    provideFinancing(),
    provideSales(),
    provideSettlements(),
    provideAnalytics(),
  ],
};
