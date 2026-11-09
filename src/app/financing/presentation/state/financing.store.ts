import { Injectable, inject, signal } from '@angular/core';
import { SimulateScheduleUseCase } from '../../application/use-cases/simulate-schedule.use-case';
import { SimulateScheduleCommand } from '../../application/models/simulate-schedule.command';
import { AmortizationSchedule } from '../../domain/model/amortization-schedule.entity';

@Injectable({
  providedIn: 'root',
})
export class FinancingStore {
  private readonly simulateUseCase = inject(SimulateScheduleUseCase);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly schedule = signal<AmortizationSchedule | null>(null);

  async simulate(command: SimulateScheduleCommand): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    const result = await this.simulateUseCase.execute(command);
    this.loading.set(false);

    if (result.isOk()) {
      this.schedule.set(result.value);
      return true;
    } else {
      this.error.set(result.error.message);
      return false;
    }
  }

  reset(): void {
    this.schedule.set(null);
    this.error.set(null);
    this.loading.set(false);
  }
}
