import { InjectionToken } from '@angular/core';

export const ACTIVE_STORE_ID = new InjectionToken<() => number | null>('ACTIVE_STORE_ID', {
  providedIn: 'root',
  factory: () => () => null,
});
