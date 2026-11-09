import { HttpClient } from '@angular/common/http';
import { ErrorHandlingEnabledBaseType } from './error-handling-enabled-base-type';

export abstract class BaseApi extends ErrorHandlingEnabledBaseType {
  constructor(
    protected readonly http: HttpClient,
    protected readonly basePath: string
  ) {
    super();
  }
}
