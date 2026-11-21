import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { z } from 'zod';
import { BaseApi, API_BASE_URL, AppError } from '@shared/index';
import {
  CreateSaleParams,
  SalesRepository,
} from '../../domain/repositories/sales.repository';
import { Sale } from '../../domain/model/sale.entity';
import { CustomerCreditInfo } from '../../domain/model/customer-credit-info.entity';
import { CatalogProduct } from '../../domain/model/catalog-product.entity';
import { SalesAssembler } from '../mappers/sales.assembler';
import {
  SaleResponseDto,
} from '../dto/sale-response.dto';
import { CustomerCreditInfoDto } from '../dto/customer-credit-info.dto';
import { CatalogProductDto } from '../dto/catalog-product.dto';
import {
  catalogProductSchema,
  customerCreditInfoSchema,
  saleResponseSchema,
} from '../schemas/sales.schema';

@Injectable({
  providedIn: 'root',
})
export class SalesHttpRepository extends BaseApi implements SalesRepository {
  private readonly assembler = inject(SalesAssembler);
  private readonly rootApiUrl = inject(API_BASE_URL);

  constructor() {
    const http = inject(HttpClient);
    const baseUrl = inject(API_BASE_URL);
    super(http, `${baseUrl}/sales`);
  }

  createSale(params: CreateSaleParams): Observable<Sale> {
    const payload = this.assembler.toCreateSaleRequestDto(params);

    return this.http.post<SaleResponseDto>(this.basePath, payload).pipe(
      map((response) => {
        const parseResult = saleResponseSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La respuesta del servidor no cumple con el esquema de venta esperado',
            422,
            parseResult.error.format()
          );
        }
        return this.assembler.toSaleEntity(parseResult.data as SaleResponseDto);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getSaleById(id: number): Observable<Sale> {
    return this.http.get<SaleResponseDto>(`${this.basePath}/${id}`).pipe(
      map((response) => {
        const parseResult = saleResponseSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La respuesta del servidor no cumple con el esquema de venta esperado',
            422,
            parseResult.error.format()
          );
        }
        return this.assembler.toSaleEntity(parseResult.data as SaleResponseDto);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  listSales(): Observable<Sale[]> {
    const listSchema = z.array(saleResponseSchema);
    return this.http.get<SaleResponseDto[]>(this.basePath).pipe(
      map((response) => {
        const parseResult = listSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La lista de ventas no cumple con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return this.assembler.toEntitiesFromResponse(parseResult.data as SaleResponseDto[]);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getCustomers(): Observable<CustomerCreditInfo[]> {
    const listSchema = z.array(customerCreditInfoSchema);
    return this.http.get<CustomerCreditInfoDto[]>(`${this.rootApiUrl}/sales/customers`).pipe(
      map((response) => {
        const parseResult = listSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La respuesta de clientes no cumple con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return (parseResult.data as CustomerCreditInfoDto[]).map((c) =>
          this.assembler.toCustomerEntity(c)
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getCatalogProducts(): Observable<CatalogProduct[]> {
    // TODO(BACKEND-INTEGRATION): Implementar esta operación
    // cuando exista el endpoint correspondiente en el backend real.
    const listSchema = z.array(catalogProductSchema);
    return this.http.get<CatalogProductDto[]>(`${this.rootApiUrl}/catalog/products`).pipe(
      map((response) => {
        const parseResult = listSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La respuesta de productos no cumple con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return (parseResult.data as CatalogProductDto[]).map((p) =>
          this.assembler.toCatalogProductEntity(p)
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }
}
