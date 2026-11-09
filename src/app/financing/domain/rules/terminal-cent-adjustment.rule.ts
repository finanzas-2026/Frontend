import { Money } from '@shared/index';

export class TerminalCentAdjustmentRule {
  /**
   * For the final installment k = n:
   * Principal amortization must extinguish remaining balance: An = S_{n-1}
   * Final payment absorbs rounding cents: Rn = An + In
   * Final balance is strictly: Sn = 0.00
   */
  static apply(remainingBalance: Money, interest: Money): { principal: Money; payment: Money; terminalBalance: Money } {
    const principal = remainingBalance;
    const payment = principal.add(interest);
    const terminalBalance = Money.zero(remainingBalance.currency);

    return { principal, payment, terminalBalance };
  }
}
