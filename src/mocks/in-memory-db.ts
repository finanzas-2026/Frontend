import Decimal from 'decimal.js';

export interface MockCustomer {
  id: number;
  full_name: string;
  document_number: string;
  credit_limit: string;
  current_debt: string;
  allows_monthly_payments: boolean;
}

export interface MockProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  stock: number;
}

export interface MockSaleDetail {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
}

export interface MockSale {
  id: number;
  code: string;
  customer_id: number;
  customer_name: string;
  store_id: number;
  payment_mode: 'CONTADO' | 'FINANCIADO_MENSUAL' | 'FINANCIADO_CUOTAS';
  total_amount: string;
  status: string;
  installments_count?: number;
  grace_days?: number;
  tea?: string;
  issue_date: string;
  details: MockSaleDetail[];
}

export interface MockSettlement {
  id: number;
  code: string;
  customer_id: number;
  customer_name: string;
  cutoff_date: string;
  due_date: string;
  principal_amount: string;
  compensatory_interest: string;
  penalty_amount: string;
  total_due: string;
  status: 'PENDING' | 'OVERDUE' | 'PAID';
  paid_date?: string;
}

export interface MockPayment {
  id: number;
  code: string;
  settlement_id: number;
  customer_id: number;
  amount: string;
  payment_date: string;
  payment_method: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE';
  reference_number?: string;
  receipt_number: string;
}

export interface MockPayoffQuote {
  settlement_id: number;
  calculation_date: string;
  days_overdue: number;
  overdue_principal: string;
  compensatory_interest: string;
  moratorium_interest: string;
  total_payoff_amount: string;
}

class InMemoryDb {
  private simulatedDate = new Date('2026-11-10T12:00:00Z');

  private customers: MockCustomer[] = [
    {
      id: 1,
      full_name: 'Juan Perez Mamani',
      document_number: '45871236',
      credit_limit: '2500.00',
      current_debt: '800.00',
      allows_monthly_payments: true,
    },
    {
      id: 2,
      full_name: 'Maria Rodriguez Santos',
      document_number: '70124589',
      credit_limit: '1200.00',
      current_debt: '100.00',
      allows_monthly_payments: false,
    },
    {
      id: 3,
      full_name: 'Carlos Quispe Flores',
      document_number: '41258963',
      credit_limit: '800.00',
      current_debt: '750.00',
      allows_monthly_payments: true,
    },
  ];

  private products: MockProduct[] = [
    {
      id: 1,
      name: 'Arroz Extra Costeño 5kg',
      sku: 'ARR-001',
      category: 'Abarrotes',
      unit_price: '24.50',
      stock: 40,
    },
    {
      id: 2,
      name: 'Aceite Primor Premium 1L',
      sku: 'ACE-002',
      category: 'Abarrotes',
      unit_price: '11.20',
      stock: 60,
    },
    {
      id: 3,
      name: 'Leche Gloria Azul 400g (Pack x6)',
      sku: 'LEC-003',
      category: 'Lácteos',
      unit_price: '25.80',
      stock: 30,
    },
    {
      id: 4,
      name: 'Azúcar Rubia Cartavio 5kg',
      sku: 'AZU-004',
      category: 'Abarrotes',
      unit_price: '21.00',
      stock: 25,
    },
    {
      id: 5,
      name: 'Detergente Bolívar 2.6kg',
      sku: 'DET-005',
      category: 'Limpieza',
      unit_price: '28.90',
      stock: 20,
    },
    {
      id: 6,
      name: 'Fideos Don Vittorio 250g',
      sku: 'FID-006',
      category: 'Abarrotes',
      unit_price: '2.30',
      stock: 150,
    },
  ];

  private sales: MockSale[] = [
    {
      id: 1,
      code: 'VTA-2026-0001',
      customer_id: 1,
      customer_name: 'Juan Perez Mamani',
      store_id: 1,
      payment_mode: 'CONTADO',
      total_amount: '70.20',
      status: 'COMPLETED',
      issue_date: '2026-11-01T10:30:00Z',
      details: [
        {
          id: 1,
          product_id: 1,
          product_name: 'Arroz Extra Costeño 5kg',
          sku: 'ARR-001',
          unit_price: '24.50',
          quantity: 2,
          subtotal: '49.00',
        },
        {
          id: 2,
          product_id: 2,
          product_name: 'Aceite Primor Premium 1L',
          sku: 'ACE-002',
          unit_price: '11.20',
          quantity: 1,
          subtotal: '11.20',
        },
      ],
    },
    {
      id: 2,
      code: 'VTA-2026-0002',
      customer_id: 1,
      customer_name: 'Juan Perez Mamani',
      store_id: 1,
      payment_mode: 'FINANCIADO_MENSUAL',
      total_amount: '450.00',
      status: 'COMPLETED',
      issue_date: '2026-11-02T15:00:00Z',
      details: [
        {
          id: 3,
          product_id: 5,
          product_name: 'Detergente Bolívar 2.6kg',
          sku: 'DET-005',
          unit_price: '28.90',
          quantity: 10,
          subtotal: '289.00',
        },
      ],
    },
  ];

  // Settlements including Caso de Prueba 2 (P=800.00, I=25.00, 10 days atraso TEA=18% -> mora=3.69, total=828.69)
  private settlements: MockSettlement[] = [
    {
      id: 1,
      code: 'LIQ-2026-10-0001',
      customer_id: 1,
      customer_name: 'Juan Perez Mamani',
      cutoff_date: '2026-10-31',
      due_date: '2026-10-31',
      principal_amount: '800.00',
      compensatory_interest: '25.00',
      penalty_amount: '3.69',
      total_due: '828.69',
      status: 'OVERDUE',
    },
    {
      id: 2,
      code: 'LIQ-2026-10-0002',
      customer_id: 2,
      customer_name: 'Maria Rodriguez Santos',
      cutoff_date: '2026-10-31',
      due_date: '2026-11-15',
      principal_amount: '100.00',
      compensatory_interest: '2.50',
      penalty_amount: '0.00',
      total_due: '102.50',
      status: 'PENDING',
    },
  ];

  private payments: MockPayment[] = [];

  getCustomers(): MockCustomer[] {
    return [...this.customers];
  }

  getCustomerById(id: number): MockCustomer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  getProducts(): MockProduct[] {
    return [...this.products];
  }

  getProductById(id: number): MockProduct | undefined {
    return this.products.find((p) => p.id === id);
  }

  getSales(): MockSale[] {
    return [...this.sales];
  }

  getSaleById(id: number): MockSale | undefined {
    return this.sales.find((s) => s.id === id);
  }

  getSettlements(): MockSettlement[] {
    return [...this.settlements];
  }

  getSettlementById(id: number): MockSettlement | undefined {
    return this.settlements.find((s) => s.id === id);
  }

  getPayments(): MockPayment[] {
    return [...this.payments];
  }

  getPayoffQuote(settlementId: number, targetDateStr?: string): MockPayoffQuote {
    const settlement = this.getSettlementById(settlementId);
    if (!settlement) {
      throw new Error(`Liquidación #${settlementId} no encontrada`);
    }

    const calcDate = targetDateStr ? new Date(targetDateStr) : this.simulatedDate;
    const dueDate = new Date(settlement.due_date);
    const diffMs = calcDate.getTime() - dueDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let moraAmount = new Decimal(0);
    if (diffDays > 0) {
      // Caso de Prueba 2: TEA = 18%, delay = diffDays
      const tea = new Decimal('0.18');
      const delayExp = new Decimal(diffDays).dividedBy(360);
      const compoundFactor = new Decimal(1).plus(tea).pow(delayExp).minus(1);
      moraAmount = new Decimal(settlement.principal_amount)
        .times(compoundFactor)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    }

    const principal = new Decimal(settlement.principal_amount);
    const compensatory = new Decimal(settlement.compensatory_interest);
    const totalPayoff = principal.plus(compensatory).plus(moraAmount);

    return {
      settlement_id: settlement.id,
      calculation_date: calcDate.toISOString(),
      days_overdue: diffDays,
      overdue_principal: principal.toFixed(2),
      compensatory_interest: compensatory.toFixed(2),
      moratorium_interest: moraAmount.toFixed(2),
      total_payoff_amount: totalPayoff.toFixed(2),
    };
  }

  createSale(data: {
    customer_id: number;
    store_id: number;
    payment_mode: 'CONTADO' | 'FINANCIADO_MENSUAL' | 'FINANCIADO_CUOTAS';
    installments_count?: number;
    grace_days?: number;
    tea?: string;
    details: { product_id: number; quantity: number; unit_price: string }[];
  }): { sale: MockSale } {
    const customer = this.getCustomerById(data.customer_id);
    if (!customer) {
      throw new Error(`Customer with ID ${data.customer_id} not found`);
    }

    let calculatedTotal = new Decimal(0);
    const saleDetails: MockSaleDetail[] = [];

    let detailIndex = 0;
    for (const item of data.details) {
      detailIndex++;
      const product = this.getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto ${product.name}`);
      }

      const unitPrice = new Decimal(item.unit_price);
      const subtotal = unitPrice.times(item.quantity);
      calculatedTotal = calculatedTotal.plus(subtotal);

      saleDetails.push({
        id: this.sales.length * 100 + detailIndex,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        unit_price: unitPrice.toFixed(2),
        quantity: item.quantity,
        subtotal: subtotal.toFixed(2),
      });

      product.stock -= item.quantity;
    }

    if (data.payment_mode !== 'CONTADO') {
      const currentDebt = new Decimal(customer.current_debt);
      const limit = new Decimal(customer.credit_limit);
      const available = limit.minus(currentDebt);

      if (calculatedTotal.greaterThan(available)) {
        throw new Error('Línea de crédito insuficiente');
      }

      customer.current_debt = currentDebt.plus(calculatedTotal).toFixed(2);
    }

    const nextId = this.sales.length + 1;
    const saleCode = `VTA-2026-${String(nextId).padStart(4, '0')}`;

    const newSale: MockSale = {
      id: nextId,
      code: saleCode,
      customer_id: customer.id,
      customer_name: customer.full_name,
      store_id: data.store_id,
      payment_mode: data.payment_mode,
      total_amount: calculatedTotal.toFixed(2),
      status: 'COMPLETED',
      installments_count: data.installments_count,
      grace_days: data.grace_days,
      tea: data.tea,
      issue_date: new Date().toISOString(),
      details: saleDetails,
    };

    this.sales.unshift(newSale);
    return { sale: newSale };
  }

  registerPayment(
    settlementId: number,
    amountStr: string,
    paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE',
    referenceNumber?: string
  ): MockPayment {
    const settlement = this.getSettlementById(settlementId);
    if (!settlement) {
      throw new Error(`Liquidación #${settlementId} no encontrada`);
    }

    const quote = this.getPayoffQuote(settlementId);
    const amountDec = new Decimal(amountStr);
    const totalRequired = new Decimal(quote.total_payoff_amount);

    if (amountDec.lessThan(totalRequired)) {
      throw new Error(
        `Pago parcial rechazado: la liquidación exige la cancelación total de S/ ${totalRequired.toFixed(2)}`
      );
    }

    // Mark settlement as paid
    settlement.status = 'PAID';
    settlement.paid_date = this.simulatedDate.toISOString();

    // Reduce customer debt
    const customer = this.getCustomerById(settlement.customer_id);
    if (customer) {
      const currentDebt = new Decimal(customer.current_debt);
      const princ = new Decimal(settlement.principal_amount);
      const updatedDebt = currentDebt.minus(princ);
      customer.current_debt = updatedDebt.greaterThan(0) ? updatedDebt.toFixed(2) : '0.00';
    }

    const nextId = this.payments.length + 1;
    const payCode = `PAG-2026-${String(nextId).padStart(4, '0')}`;
    const receiptNum = `REC-001-${String(nextId).padStart(6, '0')}`;

    const payment: MockPayment = {
      id: nextId,
      code: payCode,
      settlement_id: settlement.id,
      customer_id: settlement.customer_id,
      amount: amountDec.toFixed(2),
      payment_date: this.simulatedDate.toISOString(),
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      receipt_number: receiptNum,
    };

    this.payments.unshift(payment);
    return payment;
  }

  advanceDate(days: number): { newDate: string } {
    this.simulatedDate = new Date(this.simulatedDate.getTime() + days * 24 * 60 * 60 * 1000);
    return { newDate: this.simulatedDate.toISOString() };
  }

  runCutoff(): { message: string; generatedCount: number } {
    return {
      message: 'Cierre mensual ejecutado satisfactoriamente',
      generatedCount: this.settlements.length,
    };
  }

  reset(): void {
    const c0 = this.customers[0];
    const c1 = this.customers[1];
    const c2 = this.customers[2];
    if (c0) c0.current_debt = '800.00';
    if (c1) c1.current_debt = '100.00';
    if (c2) c2.current_debt = '750.00';
    this.simulatedDate = new Date('2026-11-10T12:00:00Z');
    const s0 = this.settlements[0];
    if (s0) {
      s0.status = 'OVERDUE';
      s0.paid_date = undefined;
    }
  }
}

export const inMemoryDb = new InMemoryDb();
