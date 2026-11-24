import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import Decimal from 'decimal.js';
import { Money, PaymentModes } from '@shared/domain';
import { CustomerCreditInfo } from '../model/customer-credit-info.entity';
import { SaleDetail } from '../model/sale-detail.entity';
import { CreditAvailabilityRule } from './credit-availability.rule';
import { MonthlyPaymentEligibilityRule } from './monthly-payment-eligibility.rule';

describe('BC Sales - Domain Rules & Properties', () => {
  const createCustomer = (limitStr: string, debtStr: string, allowsMonthly = true): CustomerCreditInfo => {
    return new CustomerCreditInfo({
      id: 1,
      fullName: 'Cliente de Prueba',
      documentNumber: '12345678',
      creditLimit: Money.fromString(limitStr).unwrap(),
      currentDebt: Money.fromString(debtStr).unwrap(),
      allowsMonthlyPayments: allowsMonthly,
    });
  };

  describe('CreditAvailabilityRule', () => {
    it('debe permitir venta al CONTADO independientemente de la línea de crédito y deuda', () => {
      const customer = createCustomer('500.00', '500.00'); // Disponible 0.00
      const saleAmount = Money.fromString('1200.00').unwrap();

      const result = CreditAvailabilityRule.validate(customer, saleAmount, PaymentModes.CASH);

      expect(result.isOk()).toBe(true);
    });

    it('debe permitir venta a crédito cuando el total es menor o igual al crédito disponible', () => {
      const customer = createCustomer('1000.00', '400.00'); // Disponible 600.00
      const saleAmount = Money.fromString('600.00').unwrap();

      const result = CreditAvailabilityRule.validate(
        customer,
        saleAmount,
        PaymentModes.INSTALLMENTS
      );

      expect(result.isOk()).toBe(true);
    });

    it('debe rechazar venta a crédito con CREDIT_LIMIT_EXCEEDED cuando excede el disponible', () => {
      const customer = createCustomer('1000.00', '400.00'); // Disponible 600.00
      const saleAmount = Money.fromString('600.01').unwrap();

      const result = CreditAvailabilityRule.validate(
        customer,
        saleAmount,
        PaymentModes.MONTH_END
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('CREDIT_LIMIT_EXCEEDED');
      }
    });
  });

  describe('MonthlyPaymentEligibilityRule', () => {
    it('debe permitir modalidad mensual si el cliente tiene autorización comercial', () => {
      const customer = createCustomer('1000.00', '0.00', true);

      const result = MonthlyPaymentEligibilityRule.validate(
        customer,
        PaymentModes.MONTH_END
      );

      expect(result.isOk()).toBe(true);
    });

    it('debe rechazar modalidad mensual si el cliente NO tiene autorización comercial', () => {
      const customer = createCustomer('1000.00', '0.00', false);

      const result = MonthlyPaymentEligibilityRule.validate(
        customer,
        PaymentModes.MONTH_END
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('MONTHLY_PAYMENT_NOT_ALLOWED');
      }
    });

    it('debe permitir modalidad cuotas o contado aunque el cliente no tenga autorización mensual', () => {
      const customer = createCustomer('1000.00', '0.00', false);

      const resContado = MonthlyPaymentEligibilityRule.validate(customer, PaymentModes.CASH);
      const resCuotas = MonthlyPaymentEligibilityRule.validate(
        customer,
        PaymentModes.INSTALLMENTS
      );

      expect(resContado.isOk()).toBe(true);
      expect(resCuotas.isOk()).toBe(true);
    });
  });

  describe('Property-Based Test: Invariante de suma de subtotales (fast-check)', () => {
    it('la suma de los subtotales de cualquier carrito debe coincidir exactamente con el total monetario', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.1, max: 500, noNaN: true }),
              qty: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            let runningSum = Money.zero();
            const details: SaleDetail[] = [];

            let i = 0;
            for (const item of items) {
              i++;
              const unitPrice = Money.fromDecimal(new Decimal(item.price.toFixed(2)));
              const detail = SaleDetail.create({
                id: i,
                productId: i,
                productName: `Producto ${i}`,
                sku: `SKU-${i}`,
                unitPrice,
                quantity: item.qty,
              });
              details.push(detail);
              runningSum = runningSum.add(detail.subtotal);
            }

            const total = details.reduce((acc, d) => acc.add(d.subtotal), Money.zero());

            expect(total.equals(runningSum)).toBe(true);
            expect(total.toString()).toBe(runningSum.toString());
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
