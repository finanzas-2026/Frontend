import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '@shared/infrastructure/base-api-endpoint';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { environment } from '../../../../environments/environment';
import { User } from '../../domain/model/user.entity';
import { UserAssembler } from '../assemblers/user.assembler';
import {
  UserCollectionResponse,
  UserResource,
} from '../resources/user.resource';

@Service()
export class UserApi extends BaseApiEndpoint<
  User,
  UserResource,
  UserCollectionResponse,
  UserAssembler
> {
  constructor() {
    super(
      inject(HttpClient),
      `${inject(API_BASE_URL)}${environment.usersEndpoint}`,
      inject(UserAssembler),
    );
  }

  findByUsername(username: string): Observable<User | null> {
    return this.search('username', username).pipe(map((users) => users[0] ?? null));
  }

  findByEmail(email: string): Observable<User | null> {
    return this.search('email', email).pipe(map((users) => users[0] ?? null));
  }

  findByStoreId(storeId: number): Observable<User[]> {
    return this.search('store_id', storeId);
  }

  private search(
    field: 'username' | 'email' | 'store_id',
    value: string | number,
  ): Observable<User[]> {
    const query = `${field}=${encodeURIComponent(String(value))}`;

    return this.http.get<UserCollectionResponse>(`${this.basePath}?${query}`).pipe(
      map((response) => this.assembler.toEntitiesFromResponse(response)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }
}
