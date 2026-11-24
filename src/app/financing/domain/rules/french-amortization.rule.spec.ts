import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateFrenchSchedule } from './french-amortization.rule';
import { calculateOverdueInterest, normalizeRates } from './french-rate-normalization';

describe('French Amortization Rule (Financial Equations)', () => {
  it('F2-1: Calcula el caso académico con la fórmula general', () => {
    // Parámetros: P = 1500.00, TNA = 24.0000000% con capitalización diaria (m=360), n = 3 meses, tg = 15 días
    const schedule = calculateFrenchSchedule({
      initialCapital: '1500.00',
      rateValue: '0.2400000',
      rateType: 'NOMINAL',
      compoundingDays: 1,
      ratePeriodDays: 360,
      totalInstallments: 3,
      graceDays: 15,
      firstDueDate: '2026-01-15',
    });

    // Validaciones de tasas normalizadas
    expect(schedule.tea).toBe('0.2711475'); // 27.1147500%
    expect(schedule.ted).toBe('0.0006667');
    expect(schedule.tep_30).toBe('0.0201945');

    // Capital capitalizado por gracia: P' = 1,515.07
    expect(schedule.capitalized_capital).toBe('1515.07');

    // Cuota regular base francesa: R = 525.56
    expect(schedule.regular_installment).toBe('525.56');

    // Verificación de cuotas:
    // Cuota 0 (gracia total)
    expect(schedule.installments[0]?.installment_number).toBe(0);
    expect(schedule.installments[0]?.is_grace_period).toBe(true);
    expect(schedule.installments[0]?.balance_amount).toBe('1515.07');

    // Cuota 1
    const inst1 = schedule.installments[1];
    expect(inst1?.installment_number).toBe(1);
    expect(inst1?.payment_amount).toBe('525.56');

    // Cuota 2
    const inst2 = schedule.installments[2];
    expect(inst2?.installment_number).toBe(2);
    expect(inst2?.payment_amount).toBe('525.56');

    // Cuota 3 (final ajustada por centavos para forzar S3 = 0.00)
    const inst3 = schedule.installments[3];
    expect(inst3?.installment_number).toBe(3);
    expect(inst3?.payment_amount).toBe('525.55');
    expect(inst3?.balance_amount).toBe('0.00');
  });

  it('F2-3: When grace period tg = 0, PPrime equals P and no k=0 row exists', () => {
    const schedule = calculateFrenchSchedule({
      initialCapital: '1000.00',
      rateValue: '0.2000000',
      rateType: 'EFFECTIVE',
      ratePeriodDays: 360,
      totalInstallments: 6,
      graceDays: 0,
    });

    expect(schedule.capitalized_capital).toBe('1000.00');
    expect(schedule.installments.length).toBe(6);
    expect(schedule.installments[0]?.installment_number).toBe(1);
    expect(schedule.installments.every((i) => !i.is_grace_period)).toBe(true);
    expect(schedule.installments[5]?.balance_amount).toBe('0.00');
  });

  it('mantiene el fin de mes y concilia cuotas con tasa cero', () => {
    const result = calculateFrenchSchedule({
      initialCapital: '100.00', rateValue: '0', ratePeriodDays: 360, rateType: 'EFFECTIVE',
      totalInstallments: 3, firstDueDate: '2026-01-31',
    });
    expect(result.total_interest).toBe('0.00');
    expect(result.total_payment).toBe('100.00');
    expect(result.installments.map((row) => row.due_date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(result.installments.map((row) => row.payment_amount)).toEqual(['33.33', '33.33', '33.34']);
  });

  it('anualiza la tasa mensual, rechaza la frecuencia semanal y conserva el valor pactado', () => {
    const input = { initialCapital: '100.00', rateValue: '0.02', ratePeriodDays: 30,
      rateType: 'EFFECTIVE' as const, totalInstallments: 2 };
    expect(calculateFrenchSchedule(input).tea).toBe('0.2682418');
    expect(input.rateValue).toBe('0.02');
    expect(() => calculateFrenchSchedule({ ...input, rateType: 'NOMINAL', compoundingDays: 7 }))
      .toThrow('Capitalización semanal pendiente');
    expect(() => calculateFrenchSchedule({ ...input, ratePeriodDays: undefined })).toThrow('período pactado');
  });

  it('no produce cuotas negativas al redondear capitales pequeños', () => {
    const result = calculateFrenchSchedule({
      initialCapital: '0.06', rateValue: '0.01', ratePeriodDays: 360, rateType: 'EFFECTIVE',
      totalInstallments: 10,
    });
    expect(result.installments.every((row) => Number(row.payment_amount) >= 0)).toBe(true);
    expect(result.total_payment).toBe('0.06');
  });

  it('calcula la mora con el pacto original y devuelve cero antes de vencer', () => {
    const { tea } = normalizeRates({ rateType: 'EFFECTIVE', rateValue: '0.18', ratePeriodDays: 360 });
    const mora = calculateOverdueInterest('800.00', tea, 10);
    expect(mora.toFixed(2)).toBe('3.69');
    expect(mora.toDecimalPlaces(2).plus(825).toFixed(2)).toBe('828.69');
    expect(calculateOverdueInterest('800.00', tea, -3).toFixed(2)).toBe('0.00');
  });

  it('F2-2: Fast-check: Strict invariants hold over 100 random schedules', () => {
    fc.assert(
      fc.property(
        fc.record({
          capital: fc.double({ min: 100, max: 50000, noNaN: true }).filter((n) => isFinite(n)),
          rate: fc.double({ min: 0.05, max: 0.80, noNaN: true }).filter((n) => isFinite(n)),
          n: fc.integer({ min: 1, max: 36 }),
          tg: fc.integer({ min: 0, max: 60 }),
          isNominal: fc.boolean(),
        }),
        ({ capital, rate, n, tg, isNominal }) => {
          const schedule = calculateFrenchSchedule({
            initialCapital: capital.toFixed(2),
            rateValue: rate.toFixed(7),
            rateType: isNominal ? 'NOMINAL' : 'EFFECTIVE',
            compoundingDays: isNominal ? 1 : undefined,
            ratePeriodDays: 360,
            totalInstallments: n,
            graceDays: tg,
          });

          // Invariant 1: Terminal balance is strictly 0.00
          const finalInstallment = schedule.installments[schedule.installments.length - 1];
          expect(finalInstallment?.balance_amount).toBe('0.00');

          // Invariant 2: For regular installments, R_k = A_k + I_k
          const regularInstallments = schedule.installments.filter((i) => !i.is_grace_period);
          for (const inst of regularInstallments) {
            const expectedPayment = (parseFloat(inst.principal_amount) + parseFloat(inst.interest_amount)).toFixed(2);
            expect(inst.payment_amount).toBe(expectedPayment);
          }

          // Invariant 3: Sum of principal amortizations equals capitalized capital P'
          const sumPrincipal = regularInstallments
            .reduce((acc, i) => acc + parseFloat(i.principal_amount), 0)
            .toFixed(2);
          expect(sumPrincipal).toBe(schedule.capitalized_capital);
        }
      ),
      { numRuns: 100 }
    );
  });
});
