import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { DashboardKpis } from '../../domain/model/dashboard-kpis.vo';
import {
  ANALYTICS_REPOSITORY,
  AnalyticsRepository,
} from '../../domain/repositories/analytics.repository';

@Injectable({
  providedIn: 'root',
})
export class GetDashboardKpisUseCase implements UseCase<void, DashboardKpis> {
  private readonly repository = inject<AnalyticsRepository>(ANALYTICS_REPOSITORY);

  async execute(): Promise<Result<DashboardKpis, AppError>> {
    try {
      const kpis = await firstValueFrom(this.repository.getDashboardKpis());
      return ok(kpis);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'GET_KPIS_FAILED',
          error instanceof Error ? error.message : 'Error al obtener métricas del dashboard'
        )
      );
    }
  }
}
