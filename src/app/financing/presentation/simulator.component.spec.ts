import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SimulatorComponent } from './pages/simulator/simulator.component';
import { ScheduleTableComponent } from './components/schedule-table/schedule-table.component';
import { Installment } from '../domain/model/installment.entity';
import { Money } from '@shared/index';
import { FINANCING_REPOSITORY } from '../domain/repositories/financing.repository';
import { FinancingAssembler } from '../infrastructure/mappers/financing.assembler';
import { SimulateScheduleResponseDto } from '../infrastructure/dto/simulate-schedule-response.dto';

const SIMULATED_DTO: SimulateScheduleResponseDto = {
  initial_capital: '1500.00',
  capitalized_capital: '1515.07',
  grace_days: 15,
  total_installments: 3,
  tea: '0.2711545',
  ted: '0.0006667',
  tep_30: '0.0201993',
  regular_installment: '525.52',
  total_interest: '76.69',
  total_payment: '1576.69',
  installments: [
    {
      id: 1,
      installment_number: 1,
      due_date: '2026-02-15',
      payment_amount: '525.52',
      principal_amount: '494.92',
      interest_amount: '30.60',
      balance_amount: '1020.15',
      is_grace_period: false,
    },
  ],
};

describe('Financing Presentation Components', () => {
  it('ScheduleTableComponent should render installment columns and mobile cards', async () => {
    const installments: Installment[] = [
      new Installment({
        id: 1,
        installmentNumber: 0,
        dueDate: '2026-01-15',
        paymentAmount: Money.zero(),
        principalAmount: Money.zero(),
        interestAmount: Money.fromString('15.07').unwrap(),
        balanceAmount: Money.fromString('1515.07').unwrap(),
        isGracePeriod: true,
      }),
      new Installment({
        id: 2,
        installmentNumber: 1,
        dueDate: '2026-02-15',
        paymentAmount: Money.fromString('525.52').unwrap(),
        principalAmount: Money.fromString('494.92').unwrap(),
        interestAmount: Money.fromString('30.60').unwrap(),
        balanceAmount: Money.fromString('1020.15').unwrap(),
        isGracePeriod: false,
      }),
    ];

    await render(ScheduleTableComponent, {
      inputs: { installments },
    });

    expect(screen.getByText('Cuota Total (R)')).toBeTruthy();
    expect(screen.getByText('0 (Gracia Total)')).toBeTruthy();
    expect(screen.getAllByText('S/ 525.52').length).toBeGreaterThanOrEqual(1);
  });

  it('SimulatorComponent should render simulator page and allow submitting simulation', async () => {
    const schedule = new FinancingAssembler().toScheduleFromResponse(SIMULATED_DTO);
    const { fixture } = await render(SimulatorComponent, {
      providers: [
        provideNoopAnimations(),
        {
          provide: FINANCING_REPOSITORY,
          useValue: { simulateSchedule: () => of(schedule) },
        },
      ],
    });

    expect(screen.getByText('Simulador de Financiamiento Francés')).toBeTruthy();
    expect(screen.getByText('Simular Cronograma')).toBeTruthy();

    const submitBtn = screen.getByText('Simular Cronograma');
    await fireEvent.click(submitBtn);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getAllByText('S/ 1,515.07').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('S/ 525.52').length).toBeGreaterThanOrEqual(1);
  });
});
