import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { SETTLEMENTS_REPOSITORY } from '../domain/repositories/settlements.repository';
import { SettlementsHttpRepository } from './http/settlements-http.repository';

export function provideSettlements(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: SETTLEMENTS_REPOSITORY,
      useClass: SettlementsHttpRepository,
    },
  ]);
}
