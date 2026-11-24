import { InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

// The browser always calls the same-origin API proxy configured by the host.
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.salesCreditBaseApi,
});
