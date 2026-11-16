import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/base-api';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { environment } from '../../../../environments/environment';
import { SignInRequest } from '../resources/sign-in.request';
import { SignInResponse } from '../resources/sign-in.response';
import { SignUpRequest } from '../resources/sign-up.request';
import { SignUpResponse } from '../resources/sign-up.response';

/**
 * Authentication adapter.
 *
 * It deliberately does not extend `BaseApiEndpoint`: sign-in and sign-up are
 * not CRUD resources. It only reuses the shared HTTP/error base and the
 * environment endpoint configuration.
 */
@Service()
export class IamApi extends BaseApi {
  constructor() {
    super(inject(HttpClient), inject(API_BASE_URL));
  }

  signIn(request: SignInRequest): Observable<SignInResponse> {
    return this.http
      .post<SignInResponse>(`${this.basePath}${environment.signInEndpoint}`, request)
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  signUp(request: SignUpRequest): Observable<SignUpResponse> {
    return this.http
      .post<SignUpResponse>(`${this.basePath}${environment.signUpEndpoint}`, request)
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }
}
