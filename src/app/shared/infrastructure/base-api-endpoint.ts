import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseEntity } from '../domain/model/base-entity';
import { BaseResource, BaseResponse } from './base-response';
import { BaseAssembler } from './base-assembler';
import { BaseApi } from './base-api';

export abstract class BaseApiEndpoint<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse>,
> extends BaseApi {
  constructor(
    http: HttpClient,
    basePath: string,
    protected readonly assembler: TAssembler
  ) {
    super(http, basePath);
  }

  getAll(): Observable<TEntity[]> {
    return this.http
      .get<TResponse>(this.basePath)
      .pipe(
        map((res) => this.assembler.toEntitiesFromResponse(res)),
        catchError((err) => this.handleError(err))
      );
  }

  getById(id: number): Observable<TEntity> {
    return this.http
      .get<TResource>(`${this.basePath}/${id}`)
      .pipe(
        map((res) => this.assembler.toEntityFromResource(res)),
        catchError((err) => this.handleError(err))
      );
  }

  create(entity: TEntity): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http
      .post<TResource>(this.basePath, resource)
      .pipe(
        map((res) => this.assembler.toEntityFromResource(res)),
        catchError((err) => this.handleError(err))
      );
  }

  update(entity: TEntity, id: number): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http
      .put<TResource>(`${this.basePath}/${id}`, resource)
      .pipe(
        map((res) => this.assembler.toEntityFromResource(res)),
        catchError((err) => this.handleError(err))
      );
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.basePath}/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }
}
