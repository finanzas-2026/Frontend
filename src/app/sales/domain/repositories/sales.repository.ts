import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Money, PaymentMode, Rate } from '@shared/domain';
import { Sale } from '../model/sale.entity';
import { CustomerCreditInfo } from '../model/customer-credit-info.entity';
import { CatalogProduct } from '../model/catalog-product.entity';

export interface CreateSaleDetailParams {
  readonly productId: number;
  readonly quantity: number;
  readonly unitPrice: Money;
}

export interface CreateSaleParams {
  readonly customerId: number;
  readonly storeId: number;
  readonly paymentMode: PaymentMode;
  readonly installmentsCount?: number;
  readonly graceDays?: number;
  readonly tea?: Rate;
  readonly details: CreateSaleDetailParams[];
}

export interface SalesRepository {
  createSale(params: CreateSaleParams): Observable<Sale>;
  getSaleById(id: number): Observable<Sale>;
  listSales(): Observable<Sale[]>;
  getCustomers(): Observable<CustomerCreditInfo[]>;
  getCatalogProducts(): Observable<CatalogProduct[]>;
}

export const SALES_REPOSITORY = new InjectionToken<SalesRepository>('SALES_REPOSITORY');
