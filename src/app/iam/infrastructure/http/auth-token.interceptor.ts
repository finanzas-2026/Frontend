import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.salesCreditBaseApi + '/')) {
    return next(request);
  }

  if (request.url.endsWith(environment.signInEndpoint)) {
    return next(request);
  }

  const token = readStoredToken();
  return token
    ? next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    : next(request);
};

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(environment.sessionStorageKey) ?? 'null',
    ) as { token?: unknown } | null;
    return typeof stored?.token === 'string' && stored.token.length > 0
      ? stored.token
      : null;
  } catch {
    return null;
  }
}
