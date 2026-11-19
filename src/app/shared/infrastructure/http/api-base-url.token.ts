import { InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

/**
 * Base URL used by every HTTP repository.
 *
 * It resolves to `environment.salesCreditBaseApi`, which points to the backend
 * (JSON Server) on its own port. A relative path such as `/api/v1` would hit
 * the Angular dev server instead and be captured by the in-browser mock
 * worker, so requests never reach the real API.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.salesCreditBaseApi,
});
