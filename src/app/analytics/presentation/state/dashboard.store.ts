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
    try {
      const [kpiRes, flowRes] = await Promise.all([
        this.getKpisUseCase.execute(),
        this.getFlowsUseCase.execute(),
      ]);

      if (kpiRes.isOk()) this.kpis.set(kpiRes.value);
      if (flowRes.isOk()) this.monthlyFlows.set(flowRes.value);
    } catch {
      this.errorMessage.set('Error al cargar datos del dashboard gerencial');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMovements(): Promise<void> {
    this.isLoading.set(true);
    try {
      const res = await this.listMovementsUseCase.execute();
      if (res.isOk()) {
        this.movements.set(res.value);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
