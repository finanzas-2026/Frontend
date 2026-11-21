import { computed, effect, inject, signal, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { AuthStore } from '../../../iam/application/stores/auth.store';
import { InterestRatePeriods } from '../../domain/constants/interest-rate-period.constant';
import { InterestRateTypes } from '../../domain/constants/interest-rate-type.constant';
import { CreditCurrencies } from '../../domain/constants/credit-currency.constant';
import { Customer } from '../../domain/model/customer.entity';
import { CustomerApi } from '../../infrastructure/api/customer.api';

/**
 * Credit application state for the authenticated store.
 *
 * It coordinates `CustomerApi` with `AuthStore`, owns no session data and only
 * exposes customers whose `storeId` matches the current session. Results from
 * requests started in a previous session are discarded.
 */
@Service()
export class CustomerStore {
  private readonly customerApi = inject(CustomerApi);
  private readonly authStore = inject(AuthStore);

  private readonly customersState = signal<Customer[]>([]);
  private readonly selectedCustomerState = signal<Customer | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private lastSessionKey: string | null = null;

  readonly customers = computed(() => {
    const storeId = this.authStore.currentStoreId();
    return storeId === null
      ? []
      : this.customersState().filter((customer) => customer.storeId === storeId);
  });
  readonly selectedCustomer = this.selectedCustomerState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor() {
    effect(() => {
      const sessionKey = this.currentSessionKey();
      if (sessionKey === this.lastSessionKey) {
        return;
      }

      this.lastSessionKey = sessionKey;
      this.customersState.set([]);
      this.selectedCustomerState.set(null);
      this.loadingState.set(false);
      this.savingState.set(false);
      this.errorState.set(null);
    });
  }

  async loadCustomers(): Promise<void> {
    const storeId = this.authStore.currentStoreId();
    if (storeId === null) {
      this.customersState.set([]);
      this.loadingState.set(false);
      this.errorState.set(null);
      return;
    }

    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const customers = await firstValueFrom(this.customerApi.getByStoreId(storeId));
      if (!this.isCurrentContext(sessionKey, storeId)) {
        return;
      }
      this.customersState.set(customers.filter((customer) => customer.storeId === storeId));
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async getCustomerById(id: number): Promise<Customer> {
    assertPositiveId(id, 'cliente');
    const storeId = this.requireStoreId();
    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const customer = await this.resolveOwnedCustomer(id, storeId);
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertCustomer(customer);
      this.selectedCustomerState.set(customer);
      return customer;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    assertPositiveId(customer.id, 'cliente');
    const storeId = this.requireStoreId();
    assertCreditConsistency(customer);
    const sessionKey = this.currentSessionKey();
    this.savingState.set(true);
    this.errorState.set(null);

    try {
      const existing = await this.resolveOwnedCustomer(customer.id, storeId);
      this.ensureCurrentContext(sessionKey, storeId);
      const updated = await firstValueFrom(
        this.customerApi.update(existing.id, this.toUpdatePayload(customer, existing)),
      );
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertCustomer(updated);
      this.syncSelectedCustomer(updated);
      return updated;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.savingState.set(false);
      }
    }
  }

  private toUpdatePayload(customer: Customer, existing: Customer): Customer {
    return { ...customer, id: existing.id, storeId: existing.storeId, favourBalance: existing.favourBalance };
  }

  private syncSelectedCustomer(updated: Customer): void {
    if (this.selectedCustomerState()?.id === updated.id) {
      this.selectedCustomerState.set(updated);
    }
  }

  clearSelectedCustomer(): void {
    this.selectedCustomerState.set(null);
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private requireStoreId(): number {
    const storeId = this.authStore.currentStoreId();
    if (storeId === null) {
      throw new AppError(
        'STORE_REQUIRED',
        'No hay una tienda autenticada para operar los perfiles crediticios.',
        403,
      );
    }
    return storeId;
  }

  private async resolveOwnedCustomer(id: number, storeId: number): Promise<Customer> {
    const cached = this.customersState().find(
      (customer) => customer.id === id && customer.storeId === storeId,
    );
    if (cached) {
      return cached;
    }

    const customer = await firstValueFrom(this.customerApi.getById(id));
    if (customer.storeId !== storeId) {
      throw new AppError(
        'CUSTOMER_NOT_FOUND',
        'El perfil crediticio no pertenece a la tienda autenticada.',
        404,
      );
    }
    return customer;
  }

  private upsertCustomer(customer: Customer): void {
    this.customersState.update((customers) =>
      customers.some((item) => item.id === customer.id)
        ? customers.map((item) => (item.id === customer.id ? customer : item))
        : [...customers, customer],
    );
  }

  private currentSessionKey(): string | null {
    const session = this.authStore.session();
    return session === null ? null : `${session.userId}:${session.storeId ?? 'none'}`;
  }

  private isCurrentContext(sessionKey: string | null, storeId: number): boolean {
    return (
      this.currentSessionKey() === sessionKey && this.authStore.currentStoreId() === storeId
    );
  }

  private ensureCurrentContext(sessionKey: string | null, storeId: number): void {
    if (!this.isCurrentContext(sessionKey, storeId)) {
      throw new AppError(
        'SESSION_CHANGED',
        'La sesión cambió durante la operación de crédito.',
        409,
      );
    }
  }
}

function assertPositiveId(id: number, entity: string): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('INVALID_ID', `El identificador de ${entity} no es válido.`, 400);
  }
}

function assertCreditConsistency(customer: Customer): void {
  assertCreditLimits(customer);
  assertCreditPeriods(customer);
  assertCompensatoryCapitalization(customer);
  assertPenaltyCapitalization(customer);
  assertCreditCurrency(customer);
}

function assertCreditLimits(customer: Customer): void {
  assertCreditAmounts(customer);
  assertCreditDays(customer);
  assertCreditRates(customer);
}

function assertCreditAmounts(customer: Customer): void {
  if (customer.creditLimit < 0) {
    throw new AppError('INVALID_CREDIT_LIMIT', 'El límite de crédito debe ser mayor o igual que cero.', 400);
  }
  if (!Number.isInteger(customer.maxCreditMonths) || customer.maxCreditMonths < 1 || customer.maxCreditMonths > 36) {
    throw new AppError('INVALID_MAX_CREDIT_MONTHS', 'El plazo máximo debe estar entre 1 y 36 meses.', 400);
  }
  if (customer.favourBalance < 0) {
    throw new AppError('INVALID_FAVOUR_BALANCE', 'El saldo a favor debe ser mayor o igual que cero.', 400);
  }
}

function assertCreditDays(customer: Customer): void {
  if (!Number.isInteger(customer.cutoffDay) || customer.cutoffDay < 1 || customer.cutoffDay > 30) {
    throw new AppError('INVALID_CUTOFF_DAY', 'El día de corte debe estar entre 1 y 30.', 400);
  }
  if (!Number.isInteger(customer.paymentDueDay) || customer.paymentDueDay < 1 || customer.paymentDueDay > 30) {
    throw new AppError('INVALID_PAYMENT_DUE_DAY', 'El día de pago debe estar entre 1 y 30.', 400);
  }
}

function assertCreditRates(customer: Customer): void {
  if (customer.compensatoryRateValue < 0) {
    throw new AppError('INVALID_COMPENSATORY_RATE', 'La tasa compensatoria debe ser mayor o igual que cero.', 400);
  }
  if (customer.penaltyRateValue < 0) {
    throw new AppError('INVALID_PENALTY_RATE', 'La tasa moratoria debe ser mayor o igual que cero.', 400);
  }
}

function assertCreditPeriods(customer: Customer): void {
  const periods = Object.values(InterestRatePeriods);
  if (!periods.includes(customer.compensatoryRatePeriodDays)) {
    throw new AppError('INVALID_COMPENSATORY_PERIOD', 'El período de referencia compensatorio no es válido.', 400);
  }
  if (
    customer.compensatoryCapitalizationDays !== null &&
    !periods.includes(customer.compensatoryCapitalizationDays)
  ) {
    throw new AppError('INVALID_COMPENSATORY_CAPITALIZATION', 'La capitalización compensatoria no es válida.', 400);
  }
  if (!periods.includes(customer.penaltyRatePeriodDays)) {
    throw new AppError('INVALID_PENALTY_PERIOD', 'El período de referencia moratorio no es válido.', 400);
  }
  if (customer.penaltyCapitalizationDays !== null && !periods.includes(customer.penaltyCapitalizationDays)) {
    throw new AppError('INVALID_PENALTY_CAPITALIZATION', 'La capitalización moratoria no es válida.', 400);
  }
}

function assertCompensatoryCapitalization(customer: Customer): void {
  if (customer.compensatoryRateType === InterestRateTypes.NOMINAL && customer.compensatoryCapitalizationDays === null) {
    throw new AppError('CAPITALIZATION_REQUIRED', 'Una tasa nominal compensatoria requiere capitalización.', 400);
  }
  if (customer.compensatoryRateType === InterestRateTypes.EFECTIVA && customer.compensatoryCapitalizationDays !== null) {
    throw new AppError('CAPITALIZATION_MUST_BE_NULL', 'Una tasa efectiva compensatoria no admite capitalización.', 400);
  }
}

function assertPenaltyCapitalization(customer: Customer): void {
  if (customer.penaltyRateType === InterestRateTypes.NOMINAL && customer.penaltyCapitalizationDays === null) {
    throw new AppError('CAPITALIZATION_REQUIRED', 'Una tasa nominal moratoria requiere capitalización.', 400);
  }
  if (customer.penaltyRateType === InterestRateTypes.EFECTIVA && customer.penaltyCapitalizationDays !== null) {
    throw new AppError('CAPITALIZATION_MUST_BE_NULL', 'Una tasa efectiva moratoria no admite capitalización.', 400);
  }
}

function assertCreditCurrency(customer: Customer): void {
  const currencies = Object.values(CreditCurrencies);
  if (!currencies.includes(customer.creditCurrency)) {
    throw new AppError('INVALID_CREDIT_CURRENCY', 'La moneda del crédito no es válida.', 400);
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación de crédito.';
}