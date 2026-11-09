import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import {
  SETTLEMENTS_REPOSITORY,
  SettlementsRepository,
} from '../../domain/repositories/settlements.repository';

export interface RunCutoffResult {
  message: string;
  generatedCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class RunCutoffUseCase implements UseCase<void, RunCutoffResult> {
  private readonly repository = inject<SettlementsRepository>(SETTLEMENTS_REPOSITORY);

  async execute(): Promise<Result<RunCutoffResult, AppError>> {
    try {
      const result = await firstValueFrom(this.repository.runCutoff());
      return ok(result);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'CUTOFF_FAILED',
          error instanceof Error ? error.message : 'Error al ejecutar corte mensual'
        )
      );
    }
  }
}
