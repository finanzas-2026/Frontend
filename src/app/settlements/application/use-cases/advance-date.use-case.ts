import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import {
  SETTLEMENTS_REPOSITORY,
  SettlementsRepository,
} from '../../domain/repositories/settlements.repository';

export interface AdvanceDateResult {
  newDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdvanceDateUseCase implements UseCase<number, AdvanceDateResult> {
  private readonly repository = inject<SettlementsRepository>(SETTLEMENTS_REPOSITORY);

  async execute(days: number): Promise<Result<AdvanceDateResult, AppError>> {
    try {
      const result = await firstValueFrom(this.repository.advanceDate(days));
      return ok(result);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'ADVANCE_DATE_FAILED',
          error instanceof Error ? error.message : 'Error al adelantar fecha del sistema'
        )
      );
    }
  }
}
