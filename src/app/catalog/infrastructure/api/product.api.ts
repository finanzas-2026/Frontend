import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi } from '@shared';
import { environment } from '../../../../environments/environment';
import { ProductStatuses } from '../../domain/constants/product-status.constant';
import { Product } from '../../domain/model/product.entity';
import { ProductAssembler } from '../assemblers/product.assembler';
import { ProductResource, ProductWriteRequest } from '../resources/product.resource';

/**
 * HTTP adapter for the authenticated store's products.
 *
 * It uses the project API base URL and endpoint configured in `environment`;
 * Tenant scope is derived by the backend from the bearer token; no store ID is
 * sent in query parameters or mutation bodies.
 */
@Service()
export class ProductApi extends BaseApi {
  private readonly assembler = inject(ProductAssembler);

  constructor() {
    const http = inject(HttpClient);
    super(http, `${environment.salesCreditBaseApi}${environment.productsEndpoint}`);
  }

  getByStoreId(): Observable<Product[]> {
    return this.http.get<ProductResource[]>(this.basePath).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  getById(id: number): Observable<Product> {
    return this.http.get<ProductResource>(`${this.basePath}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  create(product: Product): Observable<Product> {
    const resource = toWriteRequest(this.assembler.toResourceFromEntity(product));
    return this.http.post<ProductResource>(this.basePath, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  update(id: number, product: Product): Observable<Product> {
    const resource = toWriteRequest(this.assembler.toResourceFromEntity(product));
    return this.http.put<ProductResource>(`${this.basePath}/${id}`, resource).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  updateStock(id: number, stock: number): Observable<Product> {
    const patch: Partial<ProductResource> = { current_stock: stock };
    return this.http.patch<ProductResource>(`${this.basePath}/${id}`, patch).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  deactivate(id: number): Observable<Product> {
    const patch: Partial<ProductResource> = { status: ProductStatuses.DISCONTINUED };
    return this.http.patch<ProductResource>(`${this.basePath}/${id}`, patch).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }
}

function toWriteRequest(resource: ProductResource): ProductWriteRequest {
  const { id: _id, store_id: _storeId, ...request } = resource;
  return request;
}
