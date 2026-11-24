import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/base-api';
import { environment } from '../../../../environments/environment';
import {
  AuthIdentityDto,
  SignInResponseDto,
} from '../dto/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthApi extends BaseApi {
  constructor() {
    super(inject(HttpClient), `${environment.salesCreditBaseApi}`);
  }

  signIn(identifier: string, password: string): Observable<SignInResponseDto> {
    return this.http
      .post<SignInResponseDto>(`${this.basePath}${environment.signInEndpoint}`, {
        identifier,
        password,
      })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  me(token?: string): Observable<AuthIdentityDto> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .get<AuthIdentityDto>(`${this.basePath}${environment.authMeEndpoint}`, { headers })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }
}
