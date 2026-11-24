import { Injectable } from '@angular/core';
import { BaseAssembler } from '@shared/index';
import { Money, Rate } from '@shared/domain';
import { DashboardKpis } from '../../domain/model/dashboard-kpis.vo';
import { MonthlyFlow } from '../../domain/model/monthly-flow.vo';
import {
  AuditMovement,
  MovementEventType,
} from '../../domain/model/audit-movement.entity';
import { DashboardKpisDto } from '../dto/dashboard-kpis.dto';
import { MonthlyFlowDto } from '../dto/monthly-flow.dto';
import { AuditMovementDto } from '../dto/audit-movement.dto';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsAssembler
  implements BaseAssembler<AuditMovement, AuditMovementDto, AuditMovementDto[]>
{
  toEntityFromResource(resource: AuditMovementDto): AuditMovement {
    return this.toMovementEntity(resource);
  }

  toResourceFromEntity(entity: AuditMovement): AuditMovementDto {
    return {
      id: entity.id,
      timestamp: entity.timestamp,
      event_type: entity.eventType,
      customer_name: entity.customerName,
      amount: entity.amount.toString(),
      description: entity.description,
      reference_code: entity.referenceCode,
    };
  }

  toEntitiesFromResponse(response: AuditMovementDto[]): AuditMovement[] {
    return response.map((dto) => this.toMovementEntity(dto));
  }

  toKpisEntity(dto: DashboardKpisDto): DashboardKpis {
    const totalRevenue = Money.fromString(dto.total_revenue).unwrapOr(Money.zero());
    const overduePortfolio = Money.fromString(dto.overdue_portfolio).unwrapOr(Money.zero());
    const defaultRate = Rate.fromFraction(dto.default_rate).unwrapOr(
      Rate.fromFraction('0.0000000').unwrap()
    );

    return new DashboardKpis({
      totalRevenue,
      overduePortfolio,
      activeAccounts: dto.active_accounts,
      defaultRate,
    });
  }

  toMonthlyFlowEntity(dto: MonthlyFlowDto): MonthlyFlow {
    const salesAmount = Money.fromString(dto.sales_amount).unwrapOr(Money.zero());
    const collectedAmount = Money.fromString(dto.collected_amount).unwrapOr(Money.zero());

    return new MonthlyFlow({
      month: dto.month,
      salesAmount,
      collectedAmount,
    });
  }

  toMovementEntity(dto: AuditMovementDto): AuditMovement {
    const amount = Money.fromString(dto.amount).unwrapOr(Money.zero());

    return new AuditMovement({
      id: dto.id,
      timestamp: dto.timestamp,
      eventType: dto.event_type as MovementEventType,
      customerName: dto.customer_name,
      amount,
      description: movementDescription(dto.event_type, dto.reference_code),
      referenceCode: dto.reference_code,
    });
  }
}

function movementDescription(eventType: MovementEventType, referenceCode?: string): string {
  const reference = referenceCode ? ` ${referenceCode}` : '';
  switch (eventType) {
    case 'SALE_CREATED': return `Venta registrada${reference}`;
    case 'SETTLEMENT_CUTOFF': return `Liquidación generada${reference}`;
    case 'PAYMENT_RECEIVED': return `Pago recibido${reference}`;
  }
}
