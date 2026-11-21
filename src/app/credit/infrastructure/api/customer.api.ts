import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi } from '@shared';
import { environment } from '../../../../environments/environment';
import { Customer } from '../../domain/model/customer.entity';
import { CustomerAssembler } from '../assemblers/customer.assembler';
import { CustomerCreateRequest, CustomerResource } from '../resources/customer.resource';

/**
 * HTTP adapter for the `customers` collection of JSON Server.
 *
 * It uses the project API base URL and endpoint configured in `environment`;
 * no host or route is hardcoded here. The caller supplies the store identifier:
 * this adapter never reads the authenticated session.
 */
@Service()
export class CustomerApi extends BaseApi {
  private readonly assembler = inject(CustomerAssembler);

  constructor() {
    const http = inject(HttpClient);
    super(http, `${environment.salesCreditBaseApi}${environment.customersEndpoint}`);
  }

  getByStoreId(storeId: number): Observable<Customer[]> {
    return this.http.get<CustomerResource[]>(this.basePath, { params: { store_id: storeId } }).pipe(
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

  create(customer: Customer): Observable<Customer> {
    const resource = this.assembler.toResourceFromEntity(customer);
    const { id: _id, ...request } = resource;
    return this.http.post<CustomerResource>(this.basePath, request as CustomerCreateRequest).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }

  update(id: number, customer: Customer): Observable<Customer> {
    const resource = this.assembler.toResourceFromEntity(customer);
    return this.http.put<CustomerResource>(`${this.basePath}/${id}`, resource).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError((error: unknown) => this.handleError(error)),
    );
  }
}