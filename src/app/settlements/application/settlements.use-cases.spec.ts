import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { Money } from '@shared/domain';
import { MonthlySettlement } from '../domain/model/monthly-settlement.entity';
import { PayoffQuote } from '../domain/model/payoff-quote.vo';
import { Payment } from '../domain/model/payment.entity';
import {
  SETTLEMENTS_REPOSITORY,
  SettlementsRepository,
} from '../domain/repositories/settlements.repository';
import { ListSettlementsUseCase } from './use-cases/list-settlements.use-case';
import { GetSettlementByIdUseCase } from './use-cases/get-settlement-by-id.use-case';
import { GetPayoffQuoteUseCase } from './use-cases/get-payoff-quote.use-case';
import { RegisterPaymentUseCase } from './use-cases/register-payment.use-case';

describe('Settlements BC - Use Cases', () => {
  let mockRepo: Partial<SettlementsRepository>;
  let listSettlementsUseCase: ListSettlementsUseCase;
  let getSettlementByIdUseCase: GetSettlementByIdUseCase;
  let getPayoffQuoteUseCase: GetPayoffQuoteUseCase;
  let registerPaymentUseCase: RegisterPaymentUseCase;

  const mockSettlement = new MonthlySettlement({
    id: 1,
    code: 'LIQ-2026-10-0001',
    customerId: 1,
    customerName: 'Juan Perez',
    cutoffDate: '2026-10-31',
    dueDate: '2026-10-31',
    principalAmount: Money.fromString('800.00').unwrap(),
    compensatoryInterest: Money.fromString('25.00').unwrap(),
    penaltyAmount: Money.fromString('3.69').unwrap(),
    totalDue: Money.fromString('828.69').unwrap(),
    status: 'OVERDUE',
  });

  const mockQuote = new PayoffQuote({
    settlementId: 1,
    calculationDate: '2026-11-10T12:00:00Z',
    daysOverdue: 10,
    overduePrincipal: Money.fromString('800.00').unwrap(),
    compensatoryInterest: Money.fromString('25.00').unwrap(),
    moratoriumInterest: Money.fromString('3.69').unwrap(),
    totalPayoffAmount: Money.fromString('828.69').unwrap(),
  });

  const mockPayment = new Payment({
    id: 1,
    code: 'PAG-2026-0001',
    settlementId: 1,
    customerId: 1,
    amount: Money.fromString('828.69').unwrap(),
    paymentDate: '2026-11-10T12:00:00Z',
    paymentMethod: 'CASH',
    receiptNumber: 'REC-001-000001',
  });

  beforeEach(() => {
    mockRepo = {
      listSettlements: () => of([mockSettlement]),
      getSettlementById: () => of(mockSettlement),
      getPayoffQuote: () => of(mockQuote),
      registerPayment: () => of(mockPayment),
    };

    TestBed.configureTestingModule({
      providers: [
        ListSettlementsUseCase,
        GetSettlementByIdUseCase,
        GetPayoffQuoteUseCase,
        RegisterPaymentUseCase,
        { provide: SETTLEMENTS_REPOSITORY, useValue: mockRepo },
      ],
    });

    listSettlementsUseCase = TestBed.inject(ListSettlementsUseCase);
    getSettlementByIdUseCase = TestBed.inject(GetSettlementByIdUseCase);
    getPayoffQuoteUseCase = TestBed.inject(GetPayoffQuoteUseCase);
    registerPaymentUseCase = TestBed.inject(RegisterPaymentUseCase);
  });

  it('debe listar las liquidaciones mensuales', async () => {
    const res = await listSettlementsUseCase.execute();
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.length).toBe(1);
      expect(res.value[0]?.code).toBe('LIQ-2026-10-0001');
    }
  });

  it('debe obtener liquidación por id', async () => {
    const res = await getSettlementByIdUseCase.execute(1);
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.code).toBe('LIQ-2026-10-0001');
    }
  });

  it('debe obtener la cotización de liquidación del Caso de Prueba 2', async () => {
    const res = await getPayoffQuoteUseCase.execute({ settlementId: 1 });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.moratoriumInterest.toString()).toBe('3.69');
      expect(res.value.totalPayoffAmount.toString()).toBe('828.69');
    }
  });

  it('debe registrar el pago y devolver el recibo comercial', async () => {
    const res = await registerPaymentUseCase.execute({
      idempotencyKey: "test-payment",
      settlementId: 1,
      amount: Money.fromString('828.69').unwrap(),
      paymentMethod: 'CASH',
    });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.receiptNumber).toBe('REC-001-000001');
      expect(res.value.amount.toString()).toBe('828.69');
    }
  });
});
