import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { SALES_REPOSITORY } from '../domain/repositories/sales.repository';
import { SalesHttpRepository } from './http/sales-http.repository';

export function provideSales(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: SALES_REPOSITORY,
      useClass: SalesHttpRepository,
    },
  ]);
}
