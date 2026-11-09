import { Injectable } from '@angular/core';
import { BaseAssembler } from '@shared/index';
import { Money } from '@shared/domain';
import {
  MonthlySettlement,
  SettlementStatus,
} from '../../domain/model/monthly-settlement.entity';
import { PayoffQuote } from '../../domain/model/payoff-quote.vo';
import { Payment } from '../../domain/model/payment.entity';
import { SettlementResponseDto } from '../dto/settlement-response.dto';
import { PayoffQuoteResponseDto } from '../dto/payoff-quote-response.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';

@Injectable({
  providedIn: 'root',
})
export class SettlementAssembler
  implements BaseAssembler<MonthlySettlement, SettlementResponseDto, SettlementResponseDto[]>
{
  toEntityFromResource(resource: SettlementResponseDto): MonthlySettlement {
    return this.toSettlementEntity(resource);
  }

  toResourceFromEntity(entity: MonthlySettlement): SettlementResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      customer_id: entity.customerId,
      customer_name: entity.customerName,
      cutoff_date: entity.cutoffDate,
      due_date: entity.dueDate,
      principal_amount: entity.principalAmount.toString(),
      compensatory_interest: entity.compensatoryInterest.toString(),
      penalty_amount: entity.penaltyAmount.toString(),
      total_due: entity.totalDue.toString(),
      status: entity.status,
      paid_date: entity.paidDate,
    };
  }

  toEntitiesFromResponse(response: SettlementResponseDto[]): MonthlySettlement[] {
    return response.map((dto) => this.toSettlementEntity(dto));
  }

  toSettlementEntity(dto: SettlementResponseDto): MonthlySettlement {
    const principalAmount = Money.fromString(dto.principal_amount).unwrapOr(Money.zero());
    const compensatoryInterest = Money.fromString(dto.compensatory_interest).unwrapOr(Money.zero());
    const penaltyAmount = Money.fromString(dto.penalty_amount).unwrapOr(Money.zero());
    const totalDue = Money.fromString(dto.total_due).unwrapOr(Money.zero());

    return new MonthlySettlement({
      id: dto.id,
      code: dto.code,
      customerId: dto.customer_id,
      customerName: dto.customer_name,
      cutoffDate: dto.cutoff_date,
      dueDate: dto.due_date,
      principalAmount,
      compensatoryInterest,
      penaltyAmount,
      totalDue,
      status: dto.status as SettlementStatus,
      paidDate: dto.paid_date,
    });
  }

  toPayoffQuoteEntity(dto: PayoffQuoteResponseDto): PayoffQuote {
    const overduePrincipal = Money.fromString(dto.overdue_principal).unwrapOr(Money.zero());
    const compensatoryInterest = Money.fromString(dto.compensatory_interest).unwrapOr(Money.zero());
    const moratoriumInterest = Money.fromString(dto.moratorium_interest).unwrapOr(Money.zero());
    const totalPayoffAmount = Money.fromString(dto.total_payoff_amount).unwrapOr(Money.zero());

    return new PayoffQuote({
      settlementId: dto.settlement_id,
      calculationDate: dto.calculation_date,
      daysOverdue: dto.days_overdue,
      overduePrincipal,
      compensatoryInterest,
      moratoriumInterest,
      totalPayoffAmount,
    });
  }

  toPaymentEntity(dto: PaymentResponseDto): Payment {
    const amount = Money.fromString(dto.amount).unwrapOr(Money.zero());

    return new Payment({
      id: dto.id,
      code: dto.code,
      settlementId: dto.settlement_id,
      customerId: dto.customer_id,
      amount,
      paymentDate: dto.payment_date,
      paymentMethod: dto.payment_method,
      referenceNumber: dto.reference_number,
      receiptNumber: dto.receipt_number,
    });
  }
}
