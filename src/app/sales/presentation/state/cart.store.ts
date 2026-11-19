import { Injectable, computed, inject, signal } from '@angular/core';
import { Money, PaymentMode, PaymentModes, Rate, RateTypes } from '@shared/domain';
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
  readonly rateValue = signal<string>('18.0000000');
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
    return cust.allowsMonthlyPayments;
  });

  readonly canSubmit = computed(() => {
    return (
      this.items().length > 0 &&
      this.selectedCustomer() !== null &&
      !this.isCreditExceeded() &&
      this.isMonthlyEligible() &&
      !this.isSubmitting()
    );
  });

  async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [custResult, prodResult] = await Promise.all([
        this.getCustomersUseCase.execute(),
        this.getProductsUseCase.execute(),
      ]);

      if (custResult.isOk()) {
        this.customers.set(custResult.value);
        if (custResult.value.length > 0 && !this.selectedCustomer()) {
          this.selectedCustomer.set(custResult.value[0] ?? null);
        }
      }
      if (prodResult.isOk()) {
        this.products.set(prodResult.value);
      }
    } catch {
      this.errorMessage.set('Error al cargar catálogo o clientes');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCustomer(customer: CustomerCreditInfo | null): void {
    this.selectedCustomer.set(customer);
  }

  addItem(product: CatalogProduct, qty = 1): void {
    const current = this.items();
    const existing = current.find((i) => i.product.id === product.id);

    if (existing) {
      const newQty = existing.quantity + qty;
      const subtotal = product.unitPrice.multiply(newQty);
      const updated = current.map((i) =>
        i.product.id === product.id ? { product, quantity: newQty, subtotal } : i
      );
      this.items.set(updated);
    } else {
      const subtotal = product.unitPrice.multiply(qty);
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
      const subtotal = item.product.unitPrice.multiply(newQty);
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
    if (mode === PaymentModes.FINANCIADO_CUOTAS) {
      void this.calculateSchedulePreview();
    } else {
      this.schedulePreview.set(null);
    }
  }

  setInstallmentParams(params: {
    installmentsCount?: number;
    rateValue?: string;
    graceDays?: number;
  }): void {
    if (params.installmentsCount !== undefined) {
      this.installmentsCount.set(params.installmentsCount);
    }
    if (params.rateValue !== undefined) {
      this.rateValue.set(params.rateValue);
    }
    if (params.graceDays !== undefined) {
      this.graceDays.set(params.graceDays);
    }
    if (this.paymentMode() === PaymentModes.FINANCIADO_CUOTAS) {
      void this.calculateSchedulePreview();
    }
  }

  async calculateSchedulePreview(): Promise<void> {
    const total = this.totalAmount();
    if (total.isZero()) {
      this.schedulePreview.set(null);
      return;
    }

    const rateResult = Rate.fromFraction(this.rateValue());
    if (rateResult.isErr()) return;

    try {
      const result = await this.simulateScheduleUseCase.execute({
        initialCapital: total,
        rate: rateResult.value,
        rateType: RateTypes.EFECTIVA,
        totalInstallments: this.installmentsCount(),
        graceDays: this.graceDays(),
      });
      if (result.isOk()) {
        this.schedulePreview.set(result.value);
      } else {
        this.schedulePreview.set(null);
      }
    } catch {
      this.schedulePreview.set(null);
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

  private buildCommand(cust: CustomerCreditInfo, mode: PaymentMode): CreateSaleCommand {
    const isCuotas = mode === PaymentModes.FINANCIADO_CUOTAS;
    const rateResult = Rate.fromFraction(this.rateValue());
    return {
      customerId: cust.id,
      // TODO(MULTITENANCY): Reemplazar el storeId fijo por el
      // establecimiento asociado a la sesión autenticada.
      // Validar la pertenencia del usuario cuando exista backend real.
      storeId: 1,
      paymentMode: mode,
      installmentsCount: isCuotas ? this.installmentsCount() : undefined,
      graceDays: isCuotas ? this.graceDays() : undefined,
      tea: isCuotas && rateResult.isOk() ? rateResult.value : undefined,
      details: this.items().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.unitPrice,
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
    if (!this.validateSubmission(cust, mode)) return null;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    try {
      const cmd = this.buildCommand(cust, mode);
      return await this.executeSaleCreation(cmd);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  clearCart(): void {
    this.items.set([]);
    this.schedulePreview.set(null);
  }
}
