import { Injectable, computed, inject, signal } from '@angular/core';
import { Money } from '@shared/domain';
import { ToastService } from '@shared/index';
import { MonthlySettlement } from '../../domain/model/monthly-settlement.entity';
import { PayoffQuote } from '../../domain/model/payoff-quote.vo';
import { Payment, PaymentMethod } from '../../domain/model/payment.entity';
import { ImputationBreakdown } from '../../domain/model/imputation-breakdown.vo';
import { LegalImputationOrderRule } from '../../domain/rules/legal-imputation-order.rule';
import { FullPaymentStrictRule } from '../../domain/rules/full-payment-strict.rule';
import { ListSettlementsUseCase } from '../../application/use-cases/list-settlements.use-case';
import { GetPayoffQuoteUseCase } from '../../application/use-cases/get-payoff-quote.use-case';
import { RegisterPaymentUseCase } from '../../application/use-cases/register-payment.use-case';

@Injectable({
  providedIn: 'root',
})
export class CollectionStore {
  private readonly listSettlementsUseCase = inject(ListSettlementsUseCase);
  private readonly getPayoffQuoteUseCase = inject(GetPayoffQuoteUseCase);
  private readonly registerPaymentUseCase = inject(RegisterPaymentUseCase);
  private readonly toast = inject(ToastService);

  private quoteRequest = 0;

  readonly settlements = signal<MonthlySettlement[]>([]);
  readonly selectedSettlement = signal<MonthlySettlement | null>(null);
  readonly payoffQuote = signal<PayoffQuote | null>(null);
  readonly amountToPay = signal<string>('0.00');
  readonly paymentMethod = signal<PaymentMethod>('CASH');
  readonly referenceNumber = signal<string>('');
  readonly idempotencyKey = signal<string>(newIdempotencyKey());

  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly lastReceipt = signal<Payment | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly parsedAmount = computed(() =>
    Money.fromString(this.amountToPay()).unwrapOr(Money.zero())
  );

  readonly imputationPreview = computed<ImputationBreakdown | null>(() => {
    const quote = this.payoffQuote();
    if (!quote) return null;
    return LegalImputationOrderRule.impute(
      this.parsedAmount(),
      quote.moratoriumInterest,
      quote.compensatoryInterest,
      quote.overduePrincipal
    );
  });

  readonly isPartialPaymentRejected = computed(() => {
    const quote = this.payoffQuote();
    if (!quote) return false;
    const ruleResult = FullPaymentStrictRule.validate(
      this.parsedAmount(),
      quote.totalPayoffAmount
    );
    return ruleResult.isErr();
  });

  readonly canProcessPayment = computed(() => {
    const quote = this.payoffQuote();
    return quote !== null && this.selectedSettlement()?.isPaid() === false &&
      !this.isPartialPaymentRejected() && !this.isSubmitting();
  });

  async loadSettlements(loadQuote = true): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.settlements.set([]);
    try {
      const res = await this.listSettlementsUseCase.execute();
      if (res.isErr()) {
        this.errorMessage.set(res.error.message);
        return;
      }
      this.settlements.set(res.value);
      const selectedId = this.selectedSettlement()?.id;
      const next = res.value.find((row) => row.id === selectedId) ??
        res.value.find((row) => !row.isPaid()) ?? res.value[0];
      if (next && loadQuote) await this.selectSettlement(next.id, true);
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectSettlement(id: number, refresh = false): Promise<void> {
    if (!refresh && this.selectedSettlement()?.id === id && this.payoffQuote()) return;
    const quoteRequest = ++this.quoteRequest;
    const settlement = this.settlements().find((s) => s.id === id) ?? null;
    if (this.selectedSettlement()?.id !== id) this.idempotencyKey.set(newIdempotencyKey());
    this.selectedSettlement.set(settlement);
    this.payoffQuote.set(null);
    if (settlement) await this.loadQuote(id, quoteRequest);
  }

  private async loadQuote(id: number, quoteRequest: number): Promise<void> {
    try {
      const res = await this.getPayoffQuoteUseCase.execute({ settlementId: id });
      if (res.isOk() && this.quoteRequest === quoteRequest) {
        this.payoffQuote.set(res.value);
        this.amountToPay.set(res.value.totalPayoffAmount.toString());
      }
    } catch {
      if (this.quoteRequest === quoteRequest) this.payoffQuote.set(null);
    }
  }

  setAmountToPay(val: string): void {
    if (val !== this.amountToPay()) this.idempotencyKey.set(newIdempotencyKey());
    this.amountToPay.set(val);
  }

  setPaymentMethod(method: PaymentMethod): void {
    if (method !== this.paymentMethod()) this.idempotencyKey.set(newIdempotencyKey());
    this.paymentMethod.set(method);
  }

  setReferenceNumber(value: string): void {
    if (value !== this.referenceNumber()) this.idempotencyKey.set(newIdempotencyKey());
    this.referenceNumber.set(value);
  }

  private async executePayment(settlementId: number): Promise<Payment | null> {
    try {
      const res = await this.registerPaymentUseCase.execute({
        settlementId,
        amount: this.parsedAmount(),
        paymentMethod: this.paymentMethod(),
        idempotencyKey: this.idempotencyKey(),
        referenceNumber: this.referenceNumber() || undefined,
      });

      if (res.isErr()) {
        this.errorMessage.set(res.error.message);
        this.toast.error(res.error.message);
        return null;
      }

      this.lastReceipt.set(res.value);
      this.idempotencyKey.set(newIdempotencyKey());
      this.toast.success(`Pago registrado: Recibo ${res.value.receiptNumber}`);
      await this.loadSettlements();
      return res.value;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar pago';
      this.errorMessage.set(msg);
      this.toast.error(msg);
      return null;
    }
  }

  async processPayment(): Promise<Payment | null> {
    const settlement = this.selectedSettlement();
    if (!settlement || settlement.isPaid() || !this.payoffQuote()) {
      this.toast.error('Debe seleccionar una liquidación');
      return null;
    }
    if (!this.canProcessPayment()) {
      this.toast.error('Pago parcial rechazado. Debe cancelar el total en mora.');
      return null;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    try {
      return await this.executePayment(settlement.id);
    } finally {
      this.isSubmitting.set(false);
    }
  }

}

function newIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
