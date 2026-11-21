import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
    MatCardModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    SolCurrencyPipe,
    PrecisionRatePipe,
    ScheduleTableComponent,
  ],
  template: `
    <app-page-header
      title="Simulador de Financiamiento Francés"
      subtitle="Cuotas, intereses y capital con base comercial 360/30"
    />

    <section class="simulator-layout">
      <!-- Parameters Form Card -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Parámetros de Simulación</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="simulation-form">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Capital a Financiar (S/)</mat-label>
                <input matInput type="number" formControlName="initialCapital" placeholder="1500.00" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tasa del período (%)</mat-label>
                <input matInput type="number" step="0.0000001" formControlName="rateValue" placeholder="24.0000000" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de Tasa</mat-label>
                <mat-select formControlName="rateType" aria-label="Tipo de Tasa">
                  <mat-option [value]="rateTypes.NOMINAL">Nominal</mat-option>
                  <mat-option [value]="rateTypes.EFECTIVA">Efectiva</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Período de la tasa</mat-label>
                <mat-select formControlName="ratePeriodDays">
                  @for (days of ratePeriods; track days) {
                    <mat-option [value]="days">{{ days }} días</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (form.controls.rateType.value === rateTypes.NOMINAL) {
                <mat-form-field appearance="outline">
                  <mat-label>Capitalización</mat-label>
                  <mat-select formControlName="compoundingDays">
                    @for (days of capitalizationPeriods; track days) {
                      <mat-option [value]="days">Cada {{ days }} días</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline">
                <mat-label>Plazo (Meses)</mat-label>
                <input matInput type="number" formControlName="totalInstallments" placeholder="3" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Días de Gracia Total (tg)</mat-label>
                <input matInput type="number" formControlName="graceDays" placeholder="15" />
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="form.invalid || store.loading()"
              >
                <mat-icon>calculate</mat-icon>
                Simular Cronograma
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- KPI Summary Cards -->
      @if (store.schedule(); as schedule) {
        <div class="kpi-grid">
          <mat-card class="kpi-card">
            <span class="kpi-label">Capital Capitalizado (P')</span>
            <span class="kpi-value text-primary">{{ schedule.capitalizedCapital | solCurrency }}</span>
            <span class="kpi-caption">
              @if (schedule.graceDays > 0) {
                {{ schedule.graceDays }} días de gracia
              } @else {
                Sin período de gracia
              }
            </span>
          </mat-card>

          <mat-card class="kpi-card">
            <span class="kpi-label">TEA Equivalente</span>
            <span class="kpi-value">{{ schedule.normalizedRates.tea | precisionRate }}</span>
            <span class="kpi-caption">TED: {{ schedule.normalizedRates.ted | precisionRate }}</span>
          </mat-card>

          <mat-card class="kpi-card">
            <span class="kpi-label">Cuota Uniforme (R)</span>
            <span class="kpi-value text-success">{{ schedule.regularInstallment | solCurrency }}</span>
            <span class="kpi-caption">Plazo: {{ schedule.totalInstallments }} meses</span>
          </mat-card>

          <mat-card class="kpi-card">
            <span class="kpi-label">Total Intereses</span>
            <span class="kpi-value text-warning">{{ schedule.totalInterest | solCurrency }}</span>
            <span class="kpi-caption">Total a Pagar: {{ schedule.totalPayment | solCurrency }}</span>
          </mat-card>
        </div>

        <!-- Schedule Table -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-card-title>Tabla de Amortización Francesa</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-schedule-table [installments]="schedule.installments" />
          </mat-card-content>
        </mat-card>
      } @else if (store.loading()) {
        <app-loading-state message="Procesando ecuaciones intertemporales..." />
      } @else {
        <app-empty-state
          icon="calculate"
          title="Simulador Listo"
          message="Ingrese los parámetros de financiamiento y presione 'Simular Cronograma' para generar la tabla."
        />
      }
    </section>
  `,
  styles: [
    `
      .simulator-layout {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-top: 0.5rem;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 1rem;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .kpi-card {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .kpi-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #334155;
        text-transform: uppercase;
      }
      .kpi-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
      }
      .kpi-caption {
        font-size: 0.75rem;
        color: #475569;
      }
      .text-primary {
        color: #0369a1;
      }
      .text-success {
        color: #15803d;
      }
      .text-warning {
        color: #b45309;
      }
      .table-card {
        padding: 1rem;
      }
    `,
  ],
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
