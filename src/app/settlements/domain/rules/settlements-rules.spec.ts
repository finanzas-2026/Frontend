import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import Decimal from 'decimal.js';
import { Money } from '@shared/domain';
import { LegalImputationOrderRule } from './legal-imputation-order.rule';
import { FullPaymentStrictRule } from './full-payment-strict.rule';

describe('BC Settlements - Domain Rules & Financial Properties', () => {
  describe('LegalImputationOrderRule (Art. 1257 Código Civil)', () => {
    const moraDue = Money.fromString('3.69').unwrap();
    const compDue = Money.fromString('25.00').unwrap();
    const princDue = Money.fromString('800.00').unwrap();

    it('debe imputar primero a mora cuando el pago es pequeño (ej. S/ 2.00)', () => {
      const pay = Money.fromString('2.00').unwrap();
      const imp = LegalImputationOrderRule.impute(pay, moraDue, compDue, princDue);

      expect(imp.appliedToMoratorium.toString()).toBe('2.00');
      expect(imp.appliedToCompensatory.toString()).toBe('0.00');
      expect(imp.appliedToPrincipal.toString()).toBe('0.00');
      expect(imp.creditBalance.toString()).toBe('0.00');
      expect(imp.remainingDebt.toString()).toBe('826.69');
    });

    it('debe imputar 1° mora y 2° compensatorio cuando cubre ambos (ej. S/ 20.00)', () => {
      const pay = Money.fromString('20.00').unwrap();
      const imp = LegalImputationOrderRule.impute(pay, moraDue, compDue, princDue);

      expect(imp.appliedToMoratorium.toString()).toBe('3.69');
      expect(imp.appliedToCompensatory.toString()).toBe('16.31');
      expect(imp.appliedToPrincipal.toString()).toBe('0.00');
      expect(imp.creditBalance.toString()).toBe('0.00');
      expect(imp.remainingDebt.toString()).toBe('808.69');
    });

    it('debe liquidar mora, compensatorio y capital con saldo remanente 0 (ej. S/ 828.69)', () => {
      const pay = Money.fromString('828.69').unwrap();
      const imp = LegalImputationOrderRule.impute(pay, moraDue, compDue, princDue);

      expect(imp.appliedToMoratorium.toString()).toBe('3.69');
      expect(imp.appliedToCompensatory.toString()).toBe('25.00');
      expect(imp.appliedToPrincipal.toString()).toBe('800.00');
      expect(imp.creditBalance.toString()).toBe('0.00');
      expect(imp.remainingDebt.toString()).toBe('0.00');
    });

    it('debe asignar excedente a saldo a favor cuando se paga en exceso (ej. S/ 850.00)', () => {
      const pay = Money.fromString('850.00').unwrap();
      const imp = LegalImputationOrderRule.impute(pay, moraDue, compDue, princDue);

      expect(imp.appliedToMoratorium.toString()).toBe('3.69');
      expect(imp.appliedToCompensatory.toString()).toBe('25.00');
      expect(imp.appliedToPrincipal.toString()).toBe('800.00');
      expect(imp.creditBalance.toString()).toBe('21.31');
      expect(imp.remainingDebt.toString()).toBe('0.00');
    });

    it('Property test fast-check: la suma de aplicaciones e imputaciones preserva el valor del pago', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 2000, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 10, max: 1500, noNaN: true }),
          (payNum, moraNum, compNum, princNum) => {
            const pay = Money.fromDecimal(new Decimal(payNum.toFixed(2)));
            const mora = Money.fromDecimal(new Decimal(moraNum.toFixed(2)));
            const comp = Money.fromDecimal(new Decimal(compNum.toFixed(2)));
            const princ = Money.fromDecimal(new Decimal(princNum.toFixed(2)));

            const imp = LegalImputationOrderRule.impute(pay, mora, comp, princ);

            const sumApplied = imp.appliedToMoratorium
              .add(imp.appliedToCompensatory)
              .add(imp.appliedToPrincipal)
              .add(imp.creditBalance);

            expect(sumApplied.equals(pay)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('FullPaymentStrictRule', () => {
    const totalDue = Money.fromString('828.69').unwrap();

    it('debe aceptar pago cuando amount >= totalDue', () => {
      const exactPay = Money.fromString('828.69').unwrap();
      const higherPay = Money.fromString('850.00').unwrap();

      expect(FullPaymentStrictRule.validate(exactPay, totalDue).isOk()).toBe(true);
      expect(FullPaymentStrictRule.validate(higherPay, totalDue).isOk()).toBe(true);
    });

    it('debe rechazar pago parcial cuando amount < totalDue con PARTIAL_PAYMENT_REJECTED', () => {
      const partialPay = Money.fromString('800.00').unwrap();
      const res = FullPaymentStrictRule.validate(partialPay, totalDue);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error.code).toBe('PARTIAL_PAYMENT_REJECTED');
      }
    });
  });
});
