import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UseCase, Result, ok, err, AppError } from '@shared/index';
import { AmortizationSchedule } from '../../domain/model/amortization-schedule.entity';
import { FINANCING_REPOSITORY } from '../../domain/repositories/financing.repository';
import { SimulateScheduleCommand } from '../models/simulate-schedule.command';

@Injectable({
  providedIn: 'root',
})
export class SimulateScheduleUseCase implements UseCase<SimulateScheduleCommand, AmortizationSchedule> {
  private readonly repository = inject(FINANCING_REPOSITORY);

  async execute(command: SimulateScheduleCommand): Promise<Result<AmortizationSchedule, AppError>> {
    if (command.initialCapital.isLessThanOrEqual(command.initialCapital.multiply(0))) {
      return err(new AppError('INVALID_CAPITAL', 'El capital inicial debe ser mayor a cero'));
    }

    if (command.totalInstallments <= 0 || command.totalInstallments > 60) {
      return err(
        new AppError('INVALID_TERM', 'El plazo en meses debe estar comprendido entre 1 y 60 cuotas')
      );
    }

    try {
      const schedule = await firstValueFrom(this.repository.simulateSchedule(command));
      return ok(schedule);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(
        new AppError(
          'SIMULATION_FAILED',
          error instanceof Error ? error.message : 'Error inesperado en la simulación'
        )
      );
    }
  }
}
