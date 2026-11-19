import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi } from '@shared';
import { environment } from '../../../../environments/environment';
import { User } from '../../domain/model/user.entity';
import { UserAssembler } from '../assemblers/user.assembler';
import { UserResource } from '../resources/user.resource';

/**
 * HTTP adapter for the `users` collection of JSON Server.
 *
 * It uses the project API base URL and endpoint configured in `environment`;
 * no host or route is hardcoded here.
 */
@Injectable({ providedIn: 'root' })
export class UserApi extends BaseApi {
  private readonly assembler = inject(UserAssembler);

  constructor() {
    const http = inject(HttpClient);
    super(http, `${environment.salesCreditBaseApi}${environment.usersEndpoint}`);
  }

  getAll(): Observable<User[]> {
    return this.http
      .get<UserResource[]>(this.basePath)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResponse(resources)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  getById(id: number): Observable<User> {
    return this.http
      .get<UserResource>(`${this.basePath}/${id}`)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  searchByUsername(username: string): Observable<User[]> {
    return this.http
      .get<UserResource[]>(this.basePath, { params: { username } })
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResponse(resources)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  searchByEmail(email: string): Observable<User[]> {
    return this.http
      .get<UserResource[]>(this.basePath, { params: { email } })
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResponse(resources)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  create(user: User): Observable<User> {
    const resource = this.assembler.toResourceFromEntity(user);
    return this.http
      .post<UserResource>(this.basePath, resource)
      .pipe(
        map((created) => this.assembler.toEntityFromResource(created)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  update(user: User): Observable<User> {
    const resource = this.assembler.toResourceFromEntity(user);
    return this.http
      .put<UserResource>(`${this.basePath}/${user.id}`, resource)
      .pipe(
        map((updated) => this.assembler.toEntityFromResource(updated)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.basePath}/${id}`)
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }
}
