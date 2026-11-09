import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Money } from '@shared/domain';
import { MonthlySettlement } from '../model/monthly-settlement.entity';
import { PayoffQuote } from '../model/payoff-quote.vo';
import { Payment, PaymentMethod } from '../model/payment.entity';

export interface RegisterPaymentParams {
  settlementId: number;
  amount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
}

export interface SettlementsRepository {
  listSettlements(): Observable<MonthlySettlement[]>;
  getSettlementById(id: number): Observable<MonthlySettlement>;
  getPayoffQuote(settlementId: number, targetDate?: string): Observable<PayoffQuote>;
  registerPayment(params: RegisterPaymentParams): Observable<Payment>;
  runCutoff(): Observable<{ message: string; generatedCount: number }>;
  advanceDate(days: number): Observable<{ newDate: string }>;
}

export const SETTLEMENTS_REPOSITORY = new InjectionToken<SettlementsRepository>(
  'SETTLEMENTS_REPOSITORY'
);
