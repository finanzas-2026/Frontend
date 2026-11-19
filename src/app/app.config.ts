import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { errorInterceptor } from '@shared';
import { provideFinancing } from '@financing';
import { provideSales } from '@sales';
import { provideSettlements } from '@settlements';
import { provideAnalytics } from '@analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    provideAnimationsAsync(),
    provideFinancing(),
    provideSales(),
    provideSettlements(),
    provideAnalytics(),
  ],
};
