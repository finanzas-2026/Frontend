import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/base-api';
import { environment } from '../../../../environments/environment';
import { Store } from '../../domain/model/store.entity';
import { StoreAssembler } from '../assemblers/store.assembler';
import { CreateStoreRequest, StoreResource, UpdateStoreRequest } from '../resources/store.resource';

/**
 * HTTP adapter for platform store administration.
 *
 * It uses the project API base URL and endpoint configured in `environment`;
 * no host or route is hardcoded here.
 */
@Service()
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

  create(request: CreateStoreRequest): Observable<Store> {
    return this.http
      .post<StoreResource>(this.basePath, request)
      .pipe(
        map((created) => this.assembler.toEntityFromResource(created)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  update(store: Store): Observable<Store> {
    const resource = this.assembler.toResourceFromEntity(store);
    const { id: _storeId, created_at: _createdAt, ...request } = resource;
    return this.http
      .put<StoreResource>(`${this.basePath}/${store.id}`, request as UpdateStoreRequest)
      .pipe(
        map((updated) => this.assembler.toEntityFromResource(updated)),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  deactivate(id: number): Observable<Store> {
    return this.http
      .patch<StoreResource>(`${this.basePath}/${id}`, { status: 'INACTIVE' })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((error: unknown) => this.handleError(error)),
      );
  }
}
