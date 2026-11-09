import { Injectable } from '@angular/core';
import { BaseAssembler, Money, Rate } from '@shared/index';
import { AmortizationSchedule } from '../../domain/model/amortization-schedule.entity';
import { Installment } from '../../domain/model/installment.entity';
import { NormalizedRates } from '../../domain/model/normalized-rates.vo';
import {
  SimulatedInstallmentResource,
  SimulateScheduleResponseDto,
} from '../dto/simulate-schedule-response.dto';

@Injectable({
  providedIn: 'root',
})
export class FinancingAssembler
  implements BaseAssembler<AmortizationSchedule, SimulatedInstallmentResource, SimulateScheduleResponseDto>
{
  toEntityFromResource(resource: SimulatedInstallmentResource): AmortizationSchedule {
    // Single installment conversion wrapper for BaseAssembler interface compliance
    const inst = this.toInstallmentFromResource(resource);
    const zeroMoney = Money.zero();
    const zeroRate = Rate.fromFraction('0.0000000').unwrap();
    const rates = new NormalizedRates(zeroRate, zeroRate, zeroRate);

    return new AmortizationSchedule({
      id: inst.id,
      initialCapital: zeroMoney,
      capitalizedCapital: zeroMoney,
      graceDays: 0,
      totalInstallments: 1,
      normalizedRates: rates,
      regularInstallment: inst.paymentAmount,
      totalInterest: inst.interestAmount,
      totalPayment: inst.paymentAmount,
      installments: [inst],
    });
  }

  toResourceFromEntity(entity: AmortizationSchedule): SimulatedInstallmentResource {
    const first = entity.installments[0];
    return {
      id: entity.id,
      installment_number: first ? first.installmentNumber : 1,
      due_date: first ? first.dueDate : '',
      payment_amount: first ? first.paymentAmount.toString() : '0.00',
      principal_amount: first ? first.principalAmount.toString() : '0.00',
      interest_amount: first ? first.interestAmount.toString() : '0.00',
      balance_amount: first ? first.balanceAmount.toString() : '0.00',
      is_grace_period: first ? first.isGracePeriod : false,
    };
  }

  toEntitiesFromResponse(response: SimulateScheduleResponseDto): AmortizationSchedule[] {
    const schedule = this.toScheduleFromResponse(response);
    return [schedule];
  }

  toScheduleFromResponse(dto: SimulateScheduleResponseDto): AmortizationSchedule {
    const tea = Rate.fromFraction(dto.tea).unwrap();
    const ted = Rate.fromFraction(dto.ted).unwrap();
    const tep30 = Rate.fromFraction(dto.tep_30).unwrap();
    const normalizedRates = new NormalizedRates(tea, ted, tep30);

    const installments = dto.installments.map((item, index) =>
      this.toInstallmentFromResource(item, index + 1)
    );

    return new AmortizationSchedule({
      id: 1,
      initialCapital: Money.fromString(dto.initial_capital).unwrap(),
      capitalizedCapital: Money.fromString(dto.capitalized_capital).unwrap(),
      graceDays: dto.grace_days,
      totalInstallments: dto.total_installments,
      normalizedRates,
      regularInstallment: Money.fromString(dto.regular_installment).unwrap(),
      totalInterest: Money.fromString(dto.total_interest).unwrap(),
      totalPayment: Money.fromString(dto.total_payment).unwrap(),
      installments,
    });
  }

  private toInstallmentFromResource(resource: SimulatedInstallmentResource, fallbackId = 1): Installment {
    return new Installment({
      id: resource.id || fallbackId,
      installmentNumber: resource.installment_number,
      dueDate: resource.due_date,
      paymentAmount: Money.fromString(resource.payment_amount).unwrap(),
      principalAmount: Money.fromString(resource.principal_amount).unwrap(),
      interestAmount: Money.fromString(resource.interest_amount).unwrap(),
      balanceAmount: Money.fromString(resource.balance_amount).unwrap(),
      isGracePeriod: resource.is_grace_period,
    });
  }
}
