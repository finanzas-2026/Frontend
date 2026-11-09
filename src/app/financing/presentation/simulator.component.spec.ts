import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { server } from '@mocks/server';
import { provideFinancing } from '../infrastructure/financing.providers';
import { SimulatorComponent } from './pages/simulator/simulator.component';
import { ScheduleTableComponent } from './components/schedule-table/schedule-table.component';
import { Installment } from '../domain/model/installment.entity';
import { Money, API_BASE_URL } from '@shared/index';

describe('Financing Presentation Components', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

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
    const { fixture } = await render(SimulatorComponent, {
      providers: [
        provideHttpClient(),
        provideFinancing(),
        provideNoopAnimations(),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
      ],
    });

    expect(screen.getByText('Simulador de Financiamiento Francés')).toBeTruthy();
    expect(screen.getByText('Simular Cronograma')).toBeTruthy();

    const submitBtn = screen.getByText('Simular Cronograma');
    await fireEvent.click(submitBtn);

    // Allow promise and signal update
    await new Promise((r) => setTimeout(r, 100));
    fixture.detectChanges();

    expect(screen.getAllByText('S/ 1,515.07').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('S/ 525.52').length).toBeGreaterThanOrEqual(1);
  });
});
