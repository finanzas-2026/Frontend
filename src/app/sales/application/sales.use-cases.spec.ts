import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { Money, PaymentModes } from '@shared/domain';
import { SALES_REPOSITORY, SalesRepository } from '../domain/repositories/sales.repository';
import { Sale } from '../domain/model/sale.entity';
import { CustomerCreditInfo } from '../domain/model/customer-credit-info.entity';
import { CatalogProduct } from '../domain/model/catalog-product.entity';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { ListSalesUseCase } from './use-cases/list-sales.use-case';
import { GetCustomersUseCase } from './use-cases/get-customers.use-case';
import { GetCatalogProductsUseCase } from './use-cases/get-catalog-products.use-case';

describe('Sales BC - Use Cases', () => {
  let mockSalesRepo: Partial<SalesRepository>;
  let createSaleUseCase: CreateSaleUseCase;
  let listSalesUseCase: ListSalesUseCase;
  let getCustomersUseCase: GetCustomersUseCase;
  let getProductsUseCase: GetCatalogProductsUseCase;

  const sampleCustomer = new CustomerCreditInfo({
    id: 1,
    fullName: 'Juan Perez',
    documentNumber: '12345678',
    creditLimit: Money.fromString('1000.00').unwrap(),
    currentDebt: Money.fromString('200.00').unwrap(),
    allowsMonthlyPayments: true,
  });

  const sampleProduct = new CatalogProduct({
    id: 1,
    name: 'Arroz Costeño',
    sku: 'ARR-01',
    category: 'Abarrotes',
    unitPrice: Money.fromString('20.00').unwrap(),
    stock: 50,
  });

  const sampleSale = new Sale({
    id: 10,
    code: 'VTA-2026-0010',
    customerId: 1,
    customerName: 'Juan Perez',
    storeId: 1,
    paymentMode: PaymentModes.CONTADO,
    totalAmount: Money.fromString('40.00').unwrap(),
    status: 'COMPLETED',
    issueDate: '2026-11-09T10:00:00Z',
    details: [],
  });

  beforeEach(() => {
    mockSalesRepo = {
      createSale: () => of(sampleSale),
      listSales: () => of([sampleSale]),
      getCustomers: () => of([sampleCustomer]),
      getCatalogProducts: () => of([sampleProduct]),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateSaleUseCase,
        ListSalesUseCase,
        GetCustomersUseCase,
        GetCatalogProductsUseCase,
        { provide: SALES_REPOSITORY, useValue: mockSalesRepo },
      ],
    });

    createSaleUseCase = TestBed.inject(CreateSaleUseCase);
    listSalesUseCase = TestBed.inject(ListSalesUseCase);
    getCustomersUseCase = TestBed.inject(GetCustomersUseCase);
    getProductsUseCase = TestBed.inject(GetCatalogProductsUseCase);
  });

  it('debe listar clientes correctamente', async () => {
    const result = await getCustomersUseCase.execute();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]?.fullName).toBe('Juan Perez');
    }
  });

  it('debe listar productos del catálogo correctamente', async () => {
    const result = await getProductsUseCase.execute();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]?.name).toBe('Arroz Costeño');
    }
  });

  it('debe registrar una venta mediante CreateSaleUseCase', async () => {
    const result = await createSaleUseCase.execute({
      customerId: 1,
      storeId: 1,
      paymentMode: PaymentModes.CONTADO,
      details: [{ productId: 1, quantity: 2, unitPrice: Money.fromString('20.00').unwrap() }],
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.code).toBe('VTA-2026-0010');
      expect(result.value.totalAmount.toString()).toBe('40.00');
    }
  });

  it('debe listar ventas históricas mediante ListSalesUseCase', async () => {
    const result = await listSalesUseCase.execute();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]?.code).toBe('VTA-2026-0010');
    }
  });
});
