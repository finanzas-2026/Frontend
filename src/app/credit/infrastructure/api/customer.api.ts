import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi } from '@shared';
import { environment } from '../../../../environments/environment';
import { Customer } from '../../domain/model/customer.entity';
import { CustomerAssembler } from '../assemblers/customer.assembler';
import {
  CustomerAccountRequest,
  CustomerCreateRequest,
  CustomerResource,
  CustomerUpdateRequest,
} from '../resources/customer.resource';

/**
 * HTTP adapter for customers in the authenticated store.
 *
 * It uses the project API base URL and endpoint configured in `environment`;
 * Tenant scope is derived from the bearer token; store IDs are never sent.
 */
@Service()
export class CustomerApi extends BaseApi {
  private readonly assembler = inject(CustomerAssembler);

  constructor() {
    const http = inject(HttpClient);
    super(http, `${environment.salesCreditBaseApi}${environment.customersEndpoint}`);
  }

  getByStoreId(): Observable<Customer[]> {
    return this.http.get<CustomerResource[]>(this.basePath).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<CustomerResource>(`${this.basePath}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  create(customer: Customer, account: CustomerAccountRequest): Observable<Customer> {
    const resource = this.assembler.toResourceFromEntity(customer);
    const {
      id: _id,
      store_id: _storeId,
      user_id: _userId,
      favour_balance: _favourBalance,
      full_name: _fullName,
      ...profile
    } = resource;
    const request: CustomerCreateRequest = { ...profile, ...account };
    return this.http.post<CustomerResource>(this.basePath, request).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  update(id: number, customer: Customer): Observable<Customer> {
    const resource = this.assembler.toResourceFromEntity(customer);
    const {
      id: _id,
      store_id: _storeId,
      user_id: _userId,
      favour_balance: _favourBalance,
      full_name: _fullName,
      ...request
    } = resource;
    return this.http.put<CustomerResource>(`${this.basePath}/${id}`, request as CustomerUpdateRequest).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }
}
