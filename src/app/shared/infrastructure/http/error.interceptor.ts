import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AppError } from '../../application/app-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        let code = `HTTP_${error.status}`;
        let message = error.statusText || 'HTTP Request failed';

        if (error.error && typeof error.error === 'object') {
          const body = error.error as { code?: string; message?: string };
          if (body.code) code = body.code;
          if (body.message) message = body.message;
        }

        return throwError(() => new AppError(code, message, error.status, error.error));
      }

      if (error instanceof AppError) {
        return throwError(() => error);
      }

      const fallback = new AppError('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Unknown error');
      return throwError(() => fallback);
    })
  );
};
