import { Service } from '@angular/core';
import { BaseAssembler } from '@shared';
import { Customer } from '../../domain/model/customer.entity';
import { CustomerResource } from '../resources/customer.resource';

/**
 * Maps `customers` HTTP payloads to the Domain `Customer` and back.
 *
 * It only transforms representations: no HTTP, no state and no defaults that
 * could hide inconsistent data. Capitalization days are preserved as-is,
 * including `null` for effective rates.
 */
@Service()
export class CustomerAssembler implements BaseAssembler<Customer, CustomerResource, CustomerResource[]> {
  toEntityFromResource(resource: CustomerResource): Customer {
    return {
      id: resource.id,
      storeId: resource.store_id,
      userId: resource.user_id,
      homeAddress: resource.home_address,
      phoneNumber: resource.phone_number,
      creditLimit: resource.credit_limit,
      maxCreditMonths: resource.max_credit_months,
      cutoffDay: resource.cutoff_day,
      paymentDueDay: resource.payment_due_day,
      compensatoryRateType: resource.compensatory_rate_type,
      compensatoryRatePeriodDays: resource.compensatory_rate_period_days,
      compensatoryCapitalizationDays: resource.compensatory_capitalization_days,
      compensatoryRateValue: resource.compensatory_rate_value,
      penaltyRateType: resource.penalty_rate_type,
      penaltyRatePeriodDays: resource.penalty_rate_period_days,
      penaltyCapitalizationDays: resource.penalty_capitalization_days,
      penaltyRateValue: resource.penalty_rate_value,
      creditCurrency: resource.credit_currency,
      favourBalance: resource.favour_balance,
    };
  }

  toResourceFromEntity(entity: Customer): CustomerResource {
    return {
      id: entity.id,
      store_id: entity.storeId,
      user_id: entity.userId,
      home_address: entity.homeAddress,
      phone_number: entity.phoneNumber,
      credit_limit: entity.creditLimit,
      max_credit_months: entity.maxCreditMonths,
      cutoff_day: entity.cutoffDay,
      payment_due_day: entity.paymentDueDay,
      compensatory_rate_type: entity.compensatoryRateType,
      compensatory_rate_period_days: entity.compensatoryRatePeriodDays,
      compensatory_capitalization_days: entity.compensatoryCapitalizationDays,
      compensatory_rate_value: entity.compensatoryRateValue,
      penalty_rate_type: entity.penaltyRateType,
      penalty_rate_period_days: entity.penaltyRatePeriodDays,
      penalty_capitalization_days: entity.penaltyCapitalizationDays,
      penalty_rate_value: entity.penaltyRateValue,
      credit_currency: entity.creditCurrency,
      favour_balance: entity.favourBalance,
    };
  }

  toEntitiesFromResponse(response: CustomerResource[]): Customer[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}