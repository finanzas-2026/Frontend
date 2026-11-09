import { describe, it, expect } from 'vitest';
import { SolCurrencyPipe } from './sol-currency.pipe';
import { PrecisionRatePipe } from './precision-rate.pipe';
import { Money } from '../../domain/model/money.vo';
import { Rate } from '../../domain/model/rate.vo';

describe('Shared Pipes', () => {
  describe('SolCurrencyPipe', () => {
    const pipe = new SolCurrencyPipe();

    it('should format Money instance', () => {
      const money = Money.fromString('1500.50').unwrap();
      expect(pipe.transform(money)).toBe('S/ 1,500.50');
    });

    it('should format numbers and strings', () => {
      expect(pipe.transform(1234.56)).toBe('S/ 1,234.56');
      expect(pipe.transform('800')).toBe('S/ 800.00');
    });

    it('should handle null/undefined and invalid values safely', () => {
      expect(pipe.transform(null)).toBe('S/ 0.00');
      expect(pipe.transform(undefined)).toBe('S/ 0.00');
      expect(pipe.transform('invalid')).toBe('S/ 0.00');
    });
  });

  describe('PrecisionRatePipe', () => {
    const pipe = new PrecisionRatePipe();

    it('should format Rate instance', () => {
      const rate = Rate.fromFraction('0.24').unwrap();
      expect(pipe.transform(rate)).toBe('24.0000000%');
    });

    it('should format numeric fractions and string fractions to 7 decimal percent', () => {
      expect(pipe.transform(0.24)).toBe('24.0000000%');
      expect(pipe.transform('0.0201993')).toBe('2.0199300%');
    });

    it('should handle null/undefined and invalid values safely', () => {
      expect(pipe.transform(null)).toBe('0.0000000%');
      expect(pipe.transform(undefined)).toBe('0.0000000%');
      expect(pipe.transform('invalid')).toBe('0.0000000%');
    });
  });
});
