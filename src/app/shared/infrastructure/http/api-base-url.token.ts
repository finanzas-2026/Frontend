import { InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

// Entornos y rutas de API: docs/decisions/0001-demo-api-environments.md
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.salesCreditBaseApi,
});
