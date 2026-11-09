import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Money, PaymentModes, ok } from '@shared/domain';
import { ToastService } from '@shared/index';
import { SimulateScheduleUseCase } from '@financing';
import { CartStore } from './cart.store';
import { GetCustomersUseCase } from '../../application/use-cases/get-customers.use-case';
import { GetCatalogProductsUseCase } from '../../application/use-cases/get-catalog-products.use-case';
import { CreateSaleUseCase } from '../../application/use-cases/create-sale.use-case';
import { CustomerCreditInfo } from '../../domain/model/customer-credit-info.entity';
import { CatalogProduct } from '../../domain/model/catalog-product.entity';
import { Sale } from '../../domain/model/sale.entity';

describe('Sales BC - CartStore (Signals)', () => {
  let store: CartStore;

  const mockCustomer = new CustomerCreditInfo({
    id: 1,
    fullName: 'Juan Perez',
    documentNumber: '12345678',
    creditLimit: Money.fromString('1000.00').unwrap(),
    currentDebt: Money.fromString('300.00').unwrap(), // Disponible 700.00
    allowsMonthlyPayments: true,
  });

  const mockProduct = new CatalogProduct({
    id: 1,
    name: 'Aceite Primor',
    sku: 'ACE-01',
    category: 'Abarrotes',
    unitPrice: Money.fromString('10.00').unwrap(),
    stock: 20,
  });

  const mockSale = new Sale({
    id: 1,
    code: 'VTA-2026-0001',
    customerId: 1,
    customerName: 'Juan Perez',
    storeId: 1,
    paymentMode: PaymentModes.CONTADO,
    totalAmount: Money.fromString('20.00').unwrap(),
    status: 'COMPLETED',
    issueDate: '2026-11-09T10:00:00Z',
    details: [],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartStore,
        {
          provide: GetCustomersUseCase,
          useValue: { execute: async () => ok([mockCustomer]) },
        },
        {
          provide: GetCatalogProductsUseCase,
          useValue: { execute: async () => ok([mockProduct]) },
        },
        {
          provide: CreateSaleUseCase,
          useValue: { execute: async () => ok(mockSale) },
        },
        {
          provide: SimulateScheduleUseCase,
          useValue: { execute: async () => ok(null) },
        },
        {
          provide: ToastService,
          useValue: {
            success: () => undefined,
            error: () => undefined,
            info: () => undefined,
            showSuccess: () => undefined,
            showError: () => undefined,
            showInfo: () => undefined,
          },
        },
      ],
    });

    store = TestBed.inject(CartStore);
  });

  it('debe inicializar el carrito vacío', () => {
    expect(store.items().length).toBe(0);
    expect(store.totalAmount().toString()).toBe('0.00');
    expect(store.itemsCount()).toBe(0);
    expect(store.canSubmit()).toBe(false);
  });

  it('debe agregar productos y calcular subtotales y cantidades reactivamente', () => {
    store.selectCustomer(mockCustomer);
    store.addItem(mockProduct, 2);

    expect(store.items().length).toBe(1);
    expect(store.itemsCount()).toBe(2);
    expect(store.totalAmount().toString()).toBe('20.00');
    expect(store.canSubmit()).toBe(true);
  });

  it('debe actualizar la cantidad y recalcular el total', () => {
    store.addItem(mockProduct, 1);
    store.updateItemQty(mockProduct.id, 5);

    expect(store.itemsCount()).toBe(5);
    expect(store.totalAmount().toString()).toBe('50.00');
  });

  it('debe eliminar un producto cuando la cantidad es 0', () => {
    store.addItem(mockProduct, 2);
    store.updateItemQty(mockProduct.id, 0);

    expect(store.items().length).toBe(0);
    expect(store.totalAmount().toString()).toBe('0.00');
  });

  it('debe detectar cuando el importe excede la línea de crédito disponible', () => {
    store.selectCustomer(mockCustomer); // Disponible 700.00
    store.setPaymentMode(PaymentModes.FINANCIADO_MENSUAL);

    // Agregar 71 unidades a 10.00 = 710.00
    store.addItem(mockProduct, 71);

    expect(store.isCreditExceeded()).toBe(true);
    expect(store.canSubmit()).toBe(false);
  });

  it('debe permitir la venta si se cambia a modalidad CONTADO aunque exceda la línea de crédito', () => {
    store.selectCustomer(mockCustomer);
    store.addItem(mockProduct, 71); // 710.00 > 700.00 disponible
    store.setPaymentMode(PaymentModes.CONTADO);

    expect(store.isCreditExceeded()).toBe(false);
    expect(store.canSubmit()).toBe(true);
  });
});
