import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ANALYTICS_REPOSITORY } from '../domain/repositories/analytics.repository';
import { AnalyticsHttpRepository } from './http/analytics-http.repository';

export function provideAnalytics(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ANALYTICS_REPOSITORY,
      useClass: AnalyticsHttpRepository,
    },
  ]);
}
