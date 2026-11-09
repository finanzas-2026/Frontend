import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { MonthlySettlement } from '../../domain/model/monthly-settlement.entity';
import {
  SETTLEMENTS_REPOSITORY,
  SettlementsRepository,
} from '../../domain/repositories/settlements.repository';

@Injectable({
  providedIn: 'root',
})
export class ListSettlementsUseCase implements UseCase<void, MonthlySettlement[]> {
  private readonly repository = inject<SettlementsRepository>(SETTLEMENTS_REPOSITORY);

  async execute(): Promise<Result<MonthlySettlement[], AppError>> {
    try {
      const data = await firstValueFrom(this.repository.listSettlements());
      return ok(data);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'LIST_SETTLEMENTS_FAILED',
          error instanceof Error ? error.message : 'Error al listar liquidaciones'
        )
      );
    }
  }
}
