import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TOKEN_STORAGE_PORT } from '../storage/token-storage.port';
import { SessionTokenStorage } from '../storage/session-token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TOKEN_STORAGE_PORT, { optional: true }) ?? inject(SessionTokenStorage);
  const token = tokenStorage.getToken();

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
  }

  return next(req);
};
