import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AppError } from '../../application/app-error';

const messages: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: 'El usuario o la contraseña no son correctos.',
  ACCOUNT_INACTIVE: 'Tu cuenta está inactiva.',
  STORE_INACTIVE: 'Tu tienda está inactiva o suspendida.',
  INVALID_TOKEN: 'La sesión venció. Inicia sesión nuevamente.',
  UNAUTHENTICATED: 'Inicia sesión para continuar.',
  FORBIDDEN: 'No tienes permiso para realizar esta operación.',
  VALIDATION_ERROR: 'Revisa los campos del formulario.',
  NOT_FOUND: 'No se encontró el registro solicitado.',
  INSUFFICIENT_STOCK: 'Las existencias disponibles no alcanzan para esta venta.',
  CREDIT_LIMIT_EXCEEDED: 'El importe supera el crédito disponible del cliente.',
  QUOTE_CHANGED: 'La cotización cambió. Actualiza la vista previa antes de confirmar.',
  GRACE_PERIOD_CHANGED: 'Cambió el período de gracia. Actualiza la vista previa.',
  RATE_TERMS_CHANGED: 'Cambió la tasa pactada. Actualiza la vista previa.',
  PARTIAL_PAYMENT_REJECTED: 'El importe debe cubrir toda la deuda exigible.',
  SETTLEMENT_ALREADY_PAID: 'La liquidación ya está pagada.',
  MONTH_END_NOT_ALLOWED: 'El cliente no puede financiar otra compra a fin de mes.',
  INSTALLMENTS_NOT_ALLOWED: 'El producto no admite ventas en cuotas.',
};
const fallbackMessage = 'No se pudo completar la operación. Inténtalo nuevamente.';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        let code = `HTTP_${error.status}`;

        if (error.error && typeof error.error === 'object') {
          const body = error.error as { code?: string };
          if (body.code) code = body.code;
        }

        return throwError(() => new AppError(code, messages[code] ?? fallbackMessage, error.status, error.error));
      }

      if (error instanceof AppError) {
        return throwError(() => error);
      }

      const fallback = new AppError('UNKNOWN_ERROR', fallbackMessage);
      return throwError(() => fallback);
    })
  );
};
