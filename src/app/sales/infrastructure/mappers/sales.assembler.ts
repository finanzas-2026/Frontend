import { Injectable } from '@angular/core';
import { BaseAssembler } from '@shared/index';
import { Money, PaymentMode, Rate } from '@shared/domain';
import { Sale } from '../../domain/model/sale.entity';
import { SaleDetail } from '../../domain/model/sale-detail.entity';
import { CustomerCreditInfo } from '../../domain/model/customer-credit-info.entity';
import { CatalogProduct } from '../../domain/model/catalog-product.entity';
import { CreateSaleParams } from '../../domain/repositories/sales.repository';
import {
  CreateSaleRequestDto,
} from '../dto/create-sale-request.dto';
import {
  SaleDetailResponseDto,
  SaleResponseDto,
} from '../dto/sale-response.dto';
import { CustomerCreditInfoDto } from '../dto/customer-credit-info.dto';
import { CatalogProductDto } from '../dto/catalog-product.dto';

@Injectable({
  providedIn: 'root',
})
export class SalesAssembler
  implements BaseAssembler<Sale, SaleResponseDto, SaleResponseDto[]>
{
  toEntityFromResource(resource: SaleResponseDto): Sale {
    return this.toSaleEntity(resource);
  }

  toResourceFromEntity(entity: Sale): SaleResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      customer_id: entity.customerId,
      customer_name: entity.customerName,
      store_id: entity.storeId,
      payment_mode: entity.paymentMode,
      total_amount: entity.totalAmount.toString(),
      month_end_interest: entity.monthEndInterest?.toString(),
      first_due_date: entity.firstDueDate,
      status: entity.status,
      installments_count: entity.installmentsCount,
      grace_days: entity.graceDays,
      tea: entity.tea ? entity.tea.toFractionString() : undefined,
      issue_date: entity.issueDate,
      details: entity.details.map((d) => ({
        id: d.id,
        product_id: d.productId,
        product_name: d.productName,
        sku: d.sku,
        unit_price: d.unitPrice.toString(),
        quantity: d.quantity,
        subtotal: d.subtotal.toString(),
      })),
    };
  }

  toEntitiesFromResponse(response: SaleResponseDto[]): Sale[] {
    return response.map((dto) => this.toSaleEntity(dto));
  }

  toSaleEntity(dto: SaleResponseDto): Sale {
    const totalAmount = Money.fromString(dto.total_amount).unwrapOr(Money.zero());
    const parsedTea = dto.tea ? Rate.fromFraction(dto.tea) : null;
    const teaRate = parsedTea && parsedTea.isOk() ? parsedTea.value : undefined;
    const details = dto.details.map((d) => this.toSaleDetailEntity(d));

    return new Sale({
      id: dto.id,
      code: dto.code,
      customerId: dto.customer_id,
      customerName: dto.customer_name,
      storeId: dto.store_id,
      paymentMode: dto.payment_mode as PaymentMode,
      totalAmount,
      monthEndInterest: dto.month_end_interest === undefined
        ? undefined : Money.fromString(dto.month_end_interest).unwrapOr(Money.zero()),
      firstDueDate: dto.first_due_date,
      status: dto.status,
      installmentsCount: dto.installments_count,
      graceDays: dto.grace_days,
      tea: teaRate,
      issueDate: dto.issue_date,
      details,
    });
  }

  toSaleDetailEntity(dto: SaleDetailResponseDto): SaleDetail {
    const unitPrice = Money.fromString(dto.unit_price).unwrapOr(Money.zero());
    const subtotal = Money.fromString(dto.subtotal).unwrapOr(Money.zero());

    return new SaleDetail({
      id: dto.id,
      productId: dto.product_id,
      productName: dto.product_name,
      sku: dto.sku,
      unitPrice,
      quantity: dto.quantity,
      subtotal,
    });
  }

  toCustomerEntity(dto: CustomerCreditInfoDto): CustomerCreditInfo {
    const creditLimit = Money.fromString(dto.credit_limit).unwrapOr(Money.zero());
    const currentDebt = Money.fromString(dto.current_debt).unwrapOr(Money.zero());

    return new CustomerCreditInfo({
      id: dto.id,
      fullName: dto.full_name,
      documentNumber: dto.document_number,
      creditLimit,
      currentDebt,
      allowsMonthlyPayments: dto.allows_monthly_payments,
      terms: dto.max_credit_months && dto.compensatory_rate_type && dto.compensatory_rate_value &&
        dto.compensatory_rate_period_days && dto.compensatory_capitalization_days !== undefined ? {
          maxMonths: dto.max_credit_months,
          rateType: dto.compensatory_rate_type,
          rateValue: dto.compensatory_rate_value,
          ratePeriodDays: dto.compensatory_rate_period_days,
          compoundingDays: dto.compensatory_capitalization_days,
        } : undefined,
    });
  }

  toCatalogProductEntity(dto: CatalogProductDto): CatalogProduct {
    const unitPrice = Money.fromString(dto.unit_price).unwrapOr(Money.zero());

    return new CatalogProduct({
      id: dto.id,
      name: dto.name,
      sku: dto.sku,
      category: dto.category,
      unitPrice,
      stock: dto.stock,
      creditUnitPrice: dto.credit_unit_price ? Money.fromString(dto.credit_unit_price).unwrap() : undefined,
      allowsInstallments: dto.allows_installments,
    });
  }

  toCreateSaleRequestDto(params: CreateSaleParams): CreateSaleRequestDto {
    const expectedTotal = params.details.reduce(
      (total, detail) => total.add(detail.unitPrice.multiply(detail.quantity)),
      Money.zero(),
    );
    return {
      customer_id: params.customerId,
      payment_mode: params.paymentMode,
      installments_count: params.installmentsCount,
      grace_days: params.graceDays,
      tea: params.tea ? params.tea.toFractionString() : undefined,
      expected_total: expectedTotal.toString(),
      first_due_date: params.firstDueDate,
      details: params.details.map((d) => ({
        product_id: d.productId,
        quantity: d.quantity,
      })),
    };
  }
}
