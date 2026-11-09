import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { AuditMovement } from '../../domain/model/audit-movement.entity';
import {
  ANALYTICS_REPOSITORY,
  AnalyticsRepository,
} from '../../domain/repositories/analytics.repository';

@Injectable({
  providedIn: 'root',
})
export class ListAuditMovementsUseCase implements UseCase<void, AuditMovement[]> {
  private readonly repository = inject<AnalyticsRepository>(ANALYTICS_REPOSITORY);

  async execute(): Promise<Result<AuditMovement[], AppError>> {
    try {
      const movements = await firstValueFrom(this.repository.listAuditMovements());
      return ok(movements);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'LIST_MOVEMENTS_FAILED',
          error instanceof Error ? error.message : 'Error al listar movimientos de auditoría'
        )
      );
    }
  }
}
