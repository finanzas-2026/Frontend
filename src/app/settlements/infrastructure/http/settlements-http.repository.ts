import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { z } from 'zod';
import { BaseApi, API_BASE_URL, AppError } from '@shared/index';
import {
  RegisterPaymentParams,
  SettlementsRepository,
} from '../../domain/repositories/settlements.repository';
import { MonthlySettlement } from '../../domain/model/monthly-settlement.entity';
import { PayoffQuote } from '../../domain/model/payoff-quote.vo';
import { Payment } from '../../domain/model/payment.entity';
import { SettlementAssembler } from '../mappers/settlement.assembler';
import { SettlementResponseDto } from '../dto/settlement-response.dto';
import { PayoffQuoteResponseDto } from '../dto/payoff-quote-response.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentRequestDto } from '../dto/payment-request.dto';
import {
  payoffQuoteResponseSchema,
  paymentResponseSchema,
  settlementResponseSchema,
} from '../schemas/settlements.schema';

@Injectable({
  providedIn: 'root',
})
export class SettlementsHttpRepository
  extends BaseApi
  implements SettlementsRepository
{
  private readonly assembler = inject(SettlementAssembler);

  constructor() {
    const http = inject(HttpClient);
    const baseUrl = inject(API_BASE_URL);
    super(http, `${baseUrl}/settlements`);
  }

  listSettlements(): Observable<MonthlySettlement[]> {
    const listSchema = z.array(settlementResponseSchema);
    return this.http.get<SettlementResponseDto[]>(this.basePath).pipe(
      map((response) => {
        const parseResult = listSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La lista de liquidaciones no cumple con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return this.assembler.toEntitiesFromResponse(
          parseResult.data as SettlementResponseDto[]
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getSettlementById(id: number): Observable<MonthlySettlement> {
    return this.http.get<SettlementResponseDto>(`${this.basePath}/${id}`).pipe(
      map((response) => {
        const parseResult = settlementResponseSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La liquidación no cumple con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return this.assembler.toSettlementEntity(
          parseResult.data as SettlementResponseDto
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getPayoffQuote(
    settlementId: number,
    targetDate?: string
  ): Observable<PayoffQuote> {
    const query = targetDate ? `?target_date=${targetDate}` : '';
    return this.http
      .get<PayoffQuoteResponseDto>(
        `${this.basePath}/${settlementId}/payoff-quote${query}`
      )
      .pipe(
        map((response) => {
          const parseResult = payoffQuoteResponseSchema.safeParse(response);
          if (!parseResult.success) {
            throw new AppError(
              'INVALID_RESPONSE_SCHEMA',
              'La cotización de cobro no cumple con el esquema esperado',
              422,
              parseResult.error.format()
            );
          }
          return this.assembler.toPayoffQuoteEntity(
            parseResult.data as PayoffQuoteResponseDto
          );
        }),
        catchError((error) => this.handleError(error))
      );
  }

  registerPayment(params: RegisterPaymentParams): Observable<Payment> {
    const payload: PaymentRequestDto = {
      amount: params.amount.toString(),
      payment_method: params.paymentMethod,
      reference_number: params.referenceNumber,
    };

    return this.http
      .post<PaymentResponseDto>(
        `${this.basePath}/${params.settlementId}/pay`,
        payload,
        { headers: { 'Idempotency-Key': params.idempotencyKey } },
      )
      .pipe(
        map((response) => {
          const parseResult = paymentResponseSchema.safeParse(response);
          if (!parseResult.success) {
            throw new AppError(
              'INVALID_RESPONSE_SCHEMA',
              'El recibo de pago no cumple con el esquema esperado',
              422,
              parseResult.error.format()
            );
          }
          return this.assembler.toPaymentEntity(
            parseResult.data as PaymentResponseDto
          );
        }),
        catchError((error) => this.handleError(error))
      );
  }

  runCutoff(): Observable<{ message: string; generatedCount: number }> {
    return this.http
      .post<{ message: string; generatedCount: number }>(
        `${this.basePath}/cutoff`,
        {}
      )
      .pipe(catchError((error) => this.handleError(error)));
  }
}
