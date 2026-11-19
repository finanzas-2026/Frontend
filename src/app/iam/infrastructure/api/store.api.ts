import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi } from '@shared';
import { environment } from '../../../../environments/environment';
import { Store } from '../../domain/model/store.entity';
import { StoreAssembler } from '../assemblers/store.assembler';
import { StoreResource } from '../resources/store.resource';

/**
 * HTTP adapter for the `stores` collection of JSON Server.
 *
 * It uses the project API base URL and endpoint configured in `environment`;
 * no host or route is hardcoded here.
 */
@Injectable({ providedIn: 'root' })
export class StoreApi extends BaseApi {
  private readonly assembler = inject(StoreAssembler);

  constructor() {
    const http = inject(HttpClient);
    super(http, `${environment.salesCreditBaseApi}${environment.storesEndpoint}`);
  }

  getAll(): Observable<Store[]> {
    return this.http
      .get<StoreResource[]>(this.basePath)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResponse(resources)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  getById(id: number): Observable<Store> {
    return this.http
      .get<StoreResource>(`${this.basePath}/${id}`)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  create(store: Store): Observable<Store> {
    const resource = this.assembler.toResourceFromEntity(store);
    return this.http
      .post<StoreResource>(this.basePath, resource)
      .pipe(
        map((created) => this.assembler.toEntityFromResource(created)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  update(store: Store): Observable<Store> {
    const resource = this.assembler.toResourceFromEntity(store);
    return this.http
      .put<StoreResource>(`${this.basePath}/${store.id}`, resource)
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
