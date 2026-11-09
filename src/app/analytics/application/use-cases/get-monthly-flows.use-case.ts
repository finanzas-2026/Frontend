import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { MonthlyFlow } from '../../domain/model/monthly-flow.vo';
import {
  ANALYTICS_REPOSITORY,
  AnalyticsRepository,
} from '../../domain/repositories/analytics.repository';

@Injectable({
  providedIn: 'root',
})
export class GetMonthlyFlowsUseCase implements UseCase<void, MonthlyFlow[]> {
  private readonly repository = inject<AnalyticsRepository>(ANALYTICS_REPOSITORY);

  async execute(): Promise<Result<MonthlyFlow[], AppError>> {
    try {
      const flows = await firstValueFrom(this.repository.getMonthlyFlows());
      return ok(flows);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'GET_MONTHLY_FLOWS_FAILED',
          error instanceof Error ? error.message : 'Error al obtener flujos mensuales'
        )
      );
    }
  }
}
