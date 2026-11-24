import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  PageHeaderComponent,
  EmptyStateComponent,
  LoadingStateComponent,
  SolCurrencyPipe,
  PrecisionRatePipe,
  Money,
  Rate,
  RateTypes,
  RateType,
  UiIconComponent,
} from '@shared/index';
import { ScheduleTableComponent } from '../../components/schedule-table/schedule-table.component';
import { FinancingStore } from '../../state/financing.store';
import { SimulateScheduleCommand } from '../../../application/models/simulate-schedule.command';

@Component({
  selector: 'app-simulator-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    SolCurrencyPipe,
    PrecisionRatePipe,
    ScheduleTableComponent,
    UiIconComponent,
  ],
  templateUrl: './simulator.component.html',
  styleUrl: './simulator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulatorComponent implements OnInit {
  protected readonly fb = inject(FormBuilder);
  readonly store = inject(FinancingStore);
  readonly rateTypes = RateTypes;
  readonly ratePeriods = [1, 15, 30, 360];
  readonly capitalizationPeriods = [1, 7, 15, 30, 60, 90, 180, 360];

  readonly form = this.fb.group({
    initialCapital: [1500.0, [Validators.required, Validators.min(1)]],
    rateValue: [24.0, [Validators.required, Validators.min(0)]],
    rateType: [RateTypes.NOMINAL as RateType, [Validators.required]],
    ratePeriodDays: [360, Validators.required],
    compoundingDays: [1, Validators.required],
    totalInstallments: [3, [Validators.required, Validators.min(1), Validators.max(60)]],
    graceDays: [15, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    // Automatically trigger initial simulation for Caso de Prueba 1
    this.onSubmit();
  }

  stepNumber(input: HTMLInputElement, direction: -1 | 1): void {
    if (input.step === '0.0000001') {
      const currentRate = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0;
      input.value = String(Math.max(0, Number((currentRate + direction * 0.1).toFixed(7))));
    } else if (direction > 0) {
      input.stepUp();
    } else {
      input.stepDown();
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const capital = Money.fromString(Number(val.initialCapital).toFixed(2)).unwrap();
    const rate = Rate.fromPercent(Number(val.rateValue).toFixed(7)).unwrap();

    const command: SimulateScheduleCommand = {
      initialCapital: capital,
      rate,
      rateType: val.rateType || RateTypes.NOMINAL,
      compoundingDays: val.rateType === RateTypes.NOMINAL ? val.compoundingDays ?? undefined : undefined,
      ratePeriodDays: val.ratePeriodDays ?? undefined,
      totalInstallments: Number(val.totalInstallments),
      graceDays: Number(val.graceDays),
    };

    void this.store.simulate(command);
  }
}
