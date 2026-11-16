import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '@shared/infrastructure/base-api-endpoint';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { environment } from '../../../../environments/environment';
import { Store } from '../../domain/model/store.entity';
import { StoreAssembler } from '../assemblers/store.assembler';
import {
  StoreCollectionResponse,
  StoreResource,
} from '../resources/store.resource';

@Service()
export class StoreApi extends BaseApiEndpoint<
  Store,
  StoreResource,
  StoreCollectionResponse,
  StoreAssembler
> {
  constructor() {
    super(
      inject(HttpClient),
      `${inject(API_BASE_URL)}${environment.storesEndpoint}`,
      inject(StoreAssembler),
    );
  }

  findByTaxId(taxId: string): Observable<Store | null> {
    const query = `tax_id=${encodeURIComponent(taxId)}`;

    return this.http.get<StoreCollectionResponse>(`${this.basePath}?${query}`).pipe(
      map((response) => this.assembler.toEntitiesFromResponse(response)[0] ?? null),
      catchError((error: unknown) => this.handleError(error)),
    );
  }
}
