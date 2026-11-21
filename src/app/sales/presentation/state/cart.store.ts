import { ACTIVE_STORE_ID } from '../../../shared/application/active-store.token';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Money, PaymentMode, PaymentModes, Rate } from '@shared/domain';
import { ToastService } from '@shared/index';
import { AmortizationSchedule, SimulateScheduleUseCase } from '@financing';
import { CatalogProduct } from '../../domain/model/catalog-product.entity';
import { CustomerCreditInfo } from '../../domain/model/customer-credit-info.entity';
import { Sale } from '../../domain/model/sale.entity';
import { GetCustomersUseCase } from '../../application/use-cases/get-customers.use-case';
import { GetCatalogProductsUseCase } from '../../application/use-cases/get-catalog-products.use-case';
import { CreateSaleUseCase } from '../../application/use-cases/create-sale.use-case';
import { CreateSaleCommand } from '../../application/models/create-sale.command';
import { CreditAvailabilityRule } from '../../domain/rules/credit-availability.rule';
import { MonthlyPaymentEligibilityRule } from '../../domain/rules/monthly-payment-eligibility.rule';

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
  subtotal: Money;
}

@Injectable({
  providedIn: 'root',
})
export class CartStore {
  private readonly activeStoreId = inject(ACTIVE_STORE_ID);
  private previewVersion = 0;
  private readonly getCustomersUseCase = inject(GetCustomersUseCase);
  private readonly getProductsUseCase = inject(GetCatalogProductsUseCase);
  private readonly createSaleUseCase = inject(CreateSaleUseCase);
  private readonly simulateScheduleUseCase = inject(SimulateScheduleUseCase);
  private readonly toast = inject(ToastService);

  readonly customers = signal<CustomerCreditInfo[]>([]);
  readonly products = signal<CatalogProduct[]>([]);
  readonly selectedCustomer = signal<CustomerCreditInfo | null>(null);
  readonly items = signal<CartItem[]>([]);
  readonly paymentMode = signal<PaymentMode>(PaymentModes.CONTADO);

  readonly installmentsCount = signal<number>(3);
  readonly graceDays = signal<number>(0);
  readonly schedulePreview = signal<AmortizationSchedule | null>(null);

  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly lastCreatedSale = signal<Sale | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly itemsCount = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly totalAmount = computed(() =>
    this.items().reduce((acc, item) => acc.add(item.subtotal), Money.zero())
  );

  readonly availableCredit = computed(() => {
    const cust = this.selectedCustomer();
    return cust ? cust.availableCredit : Money.zero();
  });

  readonly isCreditExceeded = computed(() => {
    const mode = this.paymentMode();
    const cust = this.selectedCustomer();
    if (mode === PaymentModes.CONTADO || !cust) {
      return false;
    }
    return this.totalAmount().isGreaterThan(this.availableCredit());
  });

  readonly isMonthlyEligible = computed(() => {
    const mode = this.paymentMode();
    const cust = this.selectedCustomer();
    if (mode !== PaymentModes.FINANCIADO_MENSUAL || !cust) {
      return true;
    }
    return cust.allowsMonthlyPayments && this.items().every((item) => item.product.allowsMonthlyPayments);
  });

  readonly canSubmit = computed(() => {
    return (
      this.items().length > 0 &&
      this.selectedCustomer() !== null &&
      this.activeStoreId() !== null &&
      this.hasValidTerms() &&
      !this.isCreditExceeded() &&
      this.isMonthlyEligible() &&
      !this.isSubmitting()
    );
  });

  private hasValidTerms(): boolean {
    const mode = this.paymentMode();
    if (mode === PaymentModes.CONTADO) return true;
    return !!this.selectedCustomer()?.terms &&
      (mode !== PaymentModes.FINANCIADO_CUOTAS || this.schedulePreview() !== null);
  }

  async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [custResult, prodResult] = await Promise.all([
        this.getCustomersUseCase.execute(),
        this.getProductsUseCase.execute(),
      ]);

      if (custResult.isErr() || prodResult.isErr()) {
        this.errorMessage.set(custResult.isErr() ? custResult.error.message :
          prodResult.isErr() ? prodResult.error.message : null);
        return;
      }
      const selectedId = this.selectedCustomer()?.id;
      this.customers.set(custResult.value);
      this.selectedCustomer.set(custResult.value.find((customer) => customer.id === selectedId) ?? null);
      this.products.set(prodResult.value);
    } catch {
      this.errorMessage.set('Error al cargar catálogo o clientes');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCustomer(customer: CustomerCreditInfo | null): void {
    this.selectedCustomer.set(customer);
    void this.calculateSchedulePreview();
  }

  addItem(product: CatalogProduct, qty = 1): void {
    const current = this.items();
    const existing = current.find((i) => i.product.id === product.id);

    if (existing) {
      const newQty = existing.quantity + qty;
      const subtotal = this.priceFor(product).multiply(newQty);
      const updated = current.map((i) =>
        i.product.id === product.id ? { product, quantity: newQty, subtotal } : i
      );
      this.items.set(updated);
    } else {
      const subtotal = this.priceFor(product).multiply(qty);
      this.items.set([...current, { product, quantity: qty, subtotal }]);
    }

    if (this.paymentMode() === PaymentModes.FINANCIADO_CUOTAS) {
      void this.calculateSchedulePreview();
    }
  }

  updateItemQty(productId: number, newQty: number): void {
    if (newQty <= 0) {
      this.removeItem(productId);
      return;
    }
    const current = this.items();
    const updated = current.map((item) => {
      if (item.product.id !== productId) return item;
      const subtotal = this.priceFor(item.product).multiply(newQty);
      return { ...item, quantity: newQty, subtotal };
    });
    this.items.set(updated);
    if (this.paymentMode() === PaymentModes.FINANCIADO_CUOTAS) {
      void this.calculateSchedulePreview();
    }
  }

  removeItem(productId: number): void {
    this.items.set(this.items().filter((i) => i.product.id !== productId));
    if (this.paymentMode() === PaymentModes.FINANCIADO_CUOTAS) {
      void this.calculateSchedulePreview();
    }
  }

  setPaymentMode(mode: PaymentMode): void {
    this.paymentMode.set(mode);
    this.items.update((items) => items.map((item) => ({
      ...item, subtotal: this.priceFor(item.product).multiply(item.quantity),
    })));
    void this.calculateSchedulePreview();
  }

  priceFor(product: CatalogProduct): Money {
    return this.paymentMode() === PaymentModes.CONTADO ? product.unitPrice : product.creditUnitPrice;
  }

  setInstallmentParams(params: {
    installmentsCount?: number;
    graceDays?: number;
  }): void {
    if (params.installmentsCount !== undefined) {
      this.installmentsCount.set(params.installmentsCount);
    }
    if (params.graceDays !== undefined) {
      this.graceDays.set(params.graceDays);
    }
    if (this.paymentMode() === PaymentModes.FINANCIADO_CUOTAS) {
      void this.calculateSchedulePreview();
    }
  }

  async calculateSchedulePreview(): Promise<void> {
    const version = ++this.previewVersion;
    this.schedulePreview.set(null);
    const customer = this.selectedCustomer();
    if (!customer) return;
    const terms = customer.terms;
    const total = this.totalAmount();
    if (this.paymentMode() !== PaymentModes.FINANCIADO_CUOTAS || total.isZero() || !terms ||
        this.installmentsCount() > terms.maxMonths) return;

    const rate = Rate.fromFraction(terms.rateValue);
    if (rate.isErr()) return;
    const result = await this.simulateScheduleUseCase.execute({
      initialCapital: total,
      rate: rate.value,
      rateType: terms.rateType,
      ratePeriodDays: terms.ratePeriodDays,
      compoundingDays: terms.compoundingDays ?? undefined,
      customerId: customer.id,
      totalInstallments: this.installmentsCount(),
      graceDays: this.graceDays(),
    });
    if (version !== this.previewVersion) return;
    if (result.isOk()) {
      this.schedulePreview.set(result.value);
    } else {
      this.errorMessage.set(result.error.message);
    }
  }

  private validateSubmission(cust: CustomerCreditInfo, mode: PaymentMode): boolean {
    const total = this.totalAmount();
    const creditCheck = CreditAvailabilityRule.validate(cust, total, mode);
    if (creditCheck.isErr()) {
      this.toast.error(creditCheck.error.message);
      return false;
    }
    const monthlyCheck = MonthlyPaymentEligibilityRule.validate(cust, mode);
    if (monthlyCheck.isErr()) {
      this.toast.error(monthlyCheck.error.message);
      return false;
    }
    return true;
  }

  private buildCommand(cust: CustomerCreditInfo, mode: PaymentMode, storeId: number): CreateSaleCommand {
    const isCuotas = mode === PaymentModes.FINANCIADO_CUOTAS;
    const preview = this.schedulePreview();
    return {
      customerId: cust.id,
      storeId,
      paymentMode: mode,
      installmentsCount: isCuotas ? this.installmentsCount() : undefined,
      graceDays: isCuotas ? this.graceDays() : undefined,
      tea: isCuotas ? preview?.normalizedRates.tea : undefined,
      firstDueDate: preview?.installments.find((installment) => !installment.isGracePeriod)?.dueDate,
      details: this.items().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: this.priceFor(item.product),
      })),
    };
  }

  private async executeSaleCreation(cmd: CreateSaleCommand): Promise<Sale | null> {
    try {
      const result = await this.createSaleUseCase.execute(cmd);
      if (result.isErr()) {
        this.errorMessage.set(result.error.message);
        this.toast.error(result.error.message);
        return null;
      }
      const sale = result.value;
      this.lastCreatedSale.set(sale);
      this.toast.success(`Venta ${sale.code} registrada exitosamente.`);
      this.clearCart();
      await this.loadInitialData();
      return sale;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar venta';
      this.errorMessage.set(msg);
      this.toast.error(msg);
      return null;
    }
  }

  async submitSale(): Promise<Sale | null> {
    const cust = this.selectedCustomer();
    if (!cust) {
      this.toast.error('Debe seleccionar un cliente antes de procesar');
      return null;
    }
    const mode = this.paymentMode();
    const storeId = this.activeStoreId();
    if (!storeId || !this.canSubmit() || !this.validateSubmission(cust, mode)) return null;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    try {
      const cmd = this.buildCommand(cust, mode, storeId);
      return await this.executeSaleCreation(cmd);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  clearCart(): void {
    this.previewVersion++;
    this.items.set([]);
    this.schedulePreview.set(null);
  }
}
