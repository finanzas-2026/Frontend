import { Provider } from '@angular/core';
import { FINANCING_REPOSITORY } from '../domain/repositories/financing.repository';
import { FinancingHttpRepository } from './http/financing-http.repository';

export { FINANCING_REPOSITORY };

export function provideFinancing(): Provider[] {
  return [
    {
      provide: FINANCING_REPOSITORY,
      useClass: FinancingHttpRepository,
    },
  ];
}
