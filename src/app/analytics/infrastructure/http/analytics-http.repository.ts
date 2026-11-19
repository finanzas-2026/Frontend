import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { z } from 'zod';
import { BaseApi, API_BASE_URL, AppError } from '@shared/index';
import { AnalyticsRepository } from '../../domain/repositories/analytics.repository';
import { DashboardKpis } from '../../domain/model/dashboard-kpis.vo';
import { MonthlyFlow } from '../../domain/model/monthly-flow.vo';
import { AuditMovement } from '../../domain/model/audit-movement.entity';
import { AnalyticsAssembler } from '../mappers/analytics.assembler';
import { DashboardKpisDto } from '../dto/dashboard-kpis.dto';
import { MonthlyFlowDto } from '../dto/monthly-flow.dto';
import { AuditMovementDto } from '../dto/audit-movement.dto';
import {
  auditMovementSchema,
  dashboardKpisSchema,
  monthlyFlowSchema,
} from '../schemas/analytics.schema';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsHttpRepository extends BaseApi implements AnalyticsRepository {
  private readonly assembler = inject(AnalyticsAssembler);

  constructor() {
    const http = inject(HttpClient);
    const baseUrl = inject(API_BASE_URL);
    super(http, `${baseUrl}/analytics`);
  }

  getDashboardKpis(): Observable<DashboardKpis> {
    // TODO(BACKEND-INTEGRATION): Implementar las operaciones de analítica
    // cuando existan los endpoints correspondientes en el backend real.
    return this.http.get<DashboardKpisDto>(`${this.basePath}/kpis`).pipe(
      map((response) => {
        const parseResult = dashboardKpisSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'Las métricas del dashboard no cumplen con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return this.assembler.toKpisEntity(parseResult.data as DashboardKpisDto);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getMonthlyFlows(): Observable<MonthlyFlow[]> {
    const listSchema = z.array(monthlyFlowSchema);
    return this.http.get<MonthlyFlowDto[]>(`${this.basePath}/monthly-flows`).pipe(
      map((response) => {
        const parseResult = listSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'Los flujos mensuales no cumplen con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return (parseResult.data as MonthlyFlowDto[]).map((f) =>
          this.assembler.toMonthlyFlowEntity(f)
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }

  listAuditMovements(): Observable<AuditMovement[]> {
    const listSchema = z.array(auditMovementSchema);
    return this.http.get<AuditMovementDto[]>(`${this.basePath}/movements`).pipe(
      map((response) => {
        const parseResult = listSchema.safeParse(response);
        if (!parseResult.success) {
          throw new AppError(
            'INVALID_RESPONSE_SCHEMA',
            'La bitácora de movimientos no cumple con el esquema esperado',
            422,
            parseResult.error.format()
          );
        }
        return (parseResult.data as AuditMovementDto[]).map((m) =>
          this.assembler.toMovementEntity(m)
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }
}
