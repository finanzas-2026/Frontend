import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardKpis } from '../model/dashboard-kpis.vo';
import { MonthlyFlow } from '../model/monthly-flow.vo';
import { AuditMovement } from '../model/audit-movement.entity';

export interface AnalyticsRepository {
  getDashboardKpis(): Observable<DashboardKpis>;
  getMonthlyFlows(): Observable<MonthlyFlow[]>;
  listAuditMovements(): Observable<AuditMovement[]>;
}

export const ANALYTICS_REPOSITORY = new InjectionToken<AnalyticsRepository>(
  'ANALYTICS_REPOSITORY'
);
