import { Injectable, inject, signal } from '@angular/core';
import { DashboardKpis } from '../../domain/model/dashboard-kpis.vo';
import { MonthlyFlow } from '../../domain/model/monthly-flow.vo';
import { AuditMovement } from '../../domain/model/audit-movement.entity';
import { GetDashboardKpisUseCase } from '../../application/use-cases/get-dashboard-kpis.use-case';
import { GetMonthlyFlowsUseCase } from '../../application/use-cases/get-monthly-flows.use-case';
import { ListAuditMovementsUseCase } from '../../application/use-cases/list-audit-movements.use-case';

@Injectable({
  providedIn: 'root',
})
export class DashboardStore {
  private readonly getKpisUseCase = inject(GetDashboardKpisUseCase);
  private readonly getFlowsUseCase = inject(GetMonthlyFlowsUseCase);
  private readonly listMovementsUseCase = inject(ListAuditMovementsUseCase);

  readonly kpis = signal<DashboardKpis | null>(null);
  readonly monthlyFlows = signal<MonthlyFlow[]>([]);
  readonly movements = signal<AuditMovement[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  async loadDashboardData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.kpis.set(null);
    this.monthlyFlows.set([]);
    try {
      const [kpiRes, flowRes] = await Promise.all([
        this.getKpisUseCase.execute(),
        this.getFlowsUseCase.execute(),
      ]);

      if (kpiRes.isErr()) {
        this.errorMessage.set(kpiRes.error.message);
      } else if (flowRes.isErr()) {
        this.errorMessage.set(flowRes.error.message);
      } else {
        this.kpis.set(kpiRes.value);
        this.monthlyFlows.set(flowRes.value);
      }
    } catch {
      this.errorMessage.set('Error al cargar datos del dashboard gerencial');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMovements(): Promise<void> {
    this.isLoading.set(true);
    this.movements.set([]);
    this.errorMessage.set(null);
    try {
      const res = await this.listMovementsUseCase.execute();
      if (res.isOk()) {
        this.movements.set(res.value);
      } else {
        this.errorMessage.set(res.error.message);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
