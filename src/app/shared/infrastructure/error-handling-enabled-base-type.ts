import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AppError } from '../application/app-error';

export abstract class ErrorHandlingEnabledBaseType {
  protected handleError(error: unknown): Observable<never> {
    if (error instanceof AppError) {
      return throwError(() => error);
    }

    let errorCode = 'UNKNOWN_HTTP_ERROR';
    let errorMessage = 'An unexpected HTTP error occurred';
    let httpStatus: number | undefined;
    let details: unknown;

    if (error instanceof HttpErrorResponse) {
      httpStatus = error.status;
      details = error.error;

      if (error.error instanceof ErrorEvent) {
        errorCode = 'CLIENT_NETWORK_ERROR';
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        errorCode = `HTTP_${error.status}`;
        errorMessage = error.message;

        if (error.error && typeof error.error === 'object') {
          const body = error.error as { code?: string; message?: string };
          if (body.code) errorCode = body.code;
          if (body.message) errorMessage = body.message;
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const appError = new AppError(errorCode, errorMessage, httpStatus, details);
    return throwError(() => appError);
  }
}
