import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  ToastService,
  UiIconComponent,
} from '@shared/index';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { CustomerStore } from '../../../application/stores/customer.store';
import {
  CreditCurrencies,
  CreditCurrency,
} from '../../../domain/constants/credit-currency.constant';
import {
  InterestRatePeriods,
  InterestRatePeriod,
} from '../../../domain/constants/interest-rate-period.constant';
import {
  InterestRateTypes,
  InterestRateType,
} from '../../../domain/constants/interest-rate-type.constant';
import { Customer } from '../../../domain/model/customer.entity';

const integerValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'number' && Number.isInteger(value)
    ? null
    : { integer: true };
};

const usernameValidator: ValidatorFn = (control) => {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  return value.length === 0 || /^[A-Za-z0-9._-]{3,50}$/.test(value)
    ? null
    : { usernameFormat: true };
};

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    UiIconComponent,
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly authStore = inject(AuthStore);
  readonly store = inject(CustomerStore);

  readonly customerId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  private readonly loadedCustomer = signal<Customer | null>(null);

  readonly hasStore = computed(() => this.authStore.currentStoreId() !== null);
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar ficha crediticia' : 'Nueva ficha crediticia',
  );
  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Actualiza las condiciones crediticias pactadas con el cliente.'
      : 'Registra las condiciones crediticias iniciales del cliente.',
  );
  readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Guardar cambios' : 'Registrar cliente',
  );

  readonly rateTypeOptions = [
    { value: InterestRateTypes.NOMINAL, label: 'Nominal' },
    { value: InterestRateTypes.EFFECTIVE, label: 'Efectiva' },
  ] as const;
  readonly periodOptions = Object.entries(InterestRatePeriods).map(([key, value]) => ({
    value,
    label: `${key} (${value} días)`,
  }));
  readonly currencyOptions = [
    { value: CreditCurrencies.PEN, label: 'PEN — Sol peruano' },
  ];

  readonly form = this.formBuilder.nonNullable.group({
    account: this.formBuilder.nonNullable.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        username: ['', [Validators.required, usernameValidator]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator },
    ),
    homeAddress: ['', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    maxCreditMonths: [
      6,
      [Validators.required, Validators.min(1), Validators.max(36), integerValidator],
    ],
    creditCurrency: [CreditCurrencies.PEN as CreditCurrency, [Validators.required]],
    cutoffDay: [
      1,
      [Validators.required, Validators.min(1), Validators.max(30), integerValidator],
    ],
    paymentDueDay: [
      1,
      [Validators.required, Validators.min(1), Validators.max(30), integerValidator],
    ],
    compensatoryRateType: [InterestRateTypes.NOMINAL as InterestRateType, [Validators.required]],
    compensatoryRatePeriodDays: [InterestRatePeriods.ANUAL as InterestRatePeriod, [Validators.required]],
    compensatoryCapitalizationDays: [InterestRatePeriods.MENSUAL as InterestRatePeriod | null],
    compensatoryRateValue: [0, [Validators.required, Validators.min(0)]],
    penaltyRateType: [InterestRateTypes.EFFECTIVE as InterestRateType, [Validators.required]],
    penaltyRatePeriodDays: [InterestRatePeriods.MENSUAL as InterestRatePeriod, [Validators.required]],
    penaltyCapitalizationDays: [null as InterestRatePeriod | null],
    penaltyRateValue: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId === null) {
      return;
    }

    this.isEditMode.set(true);
    this.form.controls.account.disable();
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set('El identificador de la ficha crediticia no es válido.');
      return;
    }

    this.customerId.set(id);
    void this.loadCustomer(id);
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.submitError.set(null);

    if (
      this.form.invalid ||
      this.store.isLoading() ||
      this.store.isSaving() ||
      this.loadError() !== null ||
      !this.hasStore()
    ) {
      return;
    }

    try {
      const customer = this.buildCustomer();
      if (this.isEditMode()) {
        await this.store.updateCustomer(customer);
        this.toast.success('Ficha crediticia actualizada correctamente.');
      } else {
        await this.store.createCustomer(customer, this.buildAccountRequest());
        this.toast.success('Cliente registrado correctamente.');
      }
      await this.router.navigate(['/credit/customers']);
    } catch {
      this.submitError.set(
        this.store.error() ?? 'No se pudo guardar la ficha crediticia.',
      );
    }
  }

  onCompensatoryTypeChange(value: InterestRateType): void {
    if (value === InterestRateTypes.EFFECTIVE) {
      this.form.controls.compensatoryCapitalizationDays.setValue(null);
    } else if (this.form.controls.compensatoryCapitalizationDays.value === null) {
      this.form.controls.compensatoryCapitalizationDays.setValue(
        InterestRatePeriods.MENSUAL,
      );
    }
  }

  onPenaltyTypeChange(value: InterestRateType): void {
    if (value === InterestRateTypes.EFFECTIVE) {
      this.form.controls.penaltyCapitalizationDays.setValue(null);
    } else if (this.form.controls.penaltyCapitalizationDays.value === null) {
      this.form.controls.penaltyCapitalizationDays.setValue(
        InterestRatePeriods.MENSUAL,
      );
    }
  }

  private async loadCustomer(id: number): Promise<void> {
    try {
      const customer = await this.store.getCustomerById(id);
      this.loadedCustomer.set(customer);
      this.form.patchValue({
        homeAddress: customer.homeAddress,
        phoneNumber: customer.phoneNumber,
        creditLimit: customer.creditLimit,
        maxCreditMonths: customer.maxCreditMonths,
        creditCurrency: customer.creditCurrency,
        cutoffDay: customer.cutoffDay,
        paymentDueDay: customer.paymentDueDay,
        compensatoryRateType: customer.compensatoryRateType,
        compensatoryRatePeriodDays: customer.compensatoryRatePeriodDays,
        compensatoryCapitalizationDays: customer.compensatoryCapitalizationDays,
        compensatoryRateValue: customer.compensatoryRateValue * 100,
        penaltyRateType: customer.penaltyRateType,
        penaltyRatePeriodDays: customer.penaltyRatePeriodDays,
        penaltyCapitalizationDays: customer.penaltyCapitalizationDays,
        penaltyRateValue: customer.penaltyRateValue * 100,
      });
    } catch {
      this.loadError.set(
        this.store.error() ?? 'No se pudo cargar la ficha crediticia.',
      );
    }
  }

  private buildCustomer(): Customer {
    const value = this.form.getRawValue();
    const {
      id = 0,
      fullName = `${value.account.firstName.trim()} ${value.account.lastName.trim()}`.trim(),
      storeId = this.authStore.currentStoreId() ?? 0,
      userId = 0,
      favourBalance = 0,
    } = this.loadedCustomer() ?? {};
    return {
      id, fullName, storeId, userId,
      homeAddress: value.homeAddress.trim(), phoneNumber: value.phoneNumber.trim(),
      creditLimit: Number(value.creditLimit), maxCreditMonths: Number(value.maxCreditMonths),
      cutoffDay: Number(value.cutoffDay), paymentDueDay: Number(value.paymentDueDay),
      compensatoryRateType: value.compensatoryRateType, compensatoryRatePeriodDays: value.compensatoryRatePeriodDays,
      compensatoryCapitalizationDays: this.resolveCapitalization(value.compensatoryRateType, value.compensatoryCapitalizationDays),
      compensatoryRateValue: Number(value.compensatoryRateValue) / 100,
      penaltyRateType: value.penaltyRateType, penaltyRatePeriodDays: value.penaltyRatePeriodDays,
      penaltyCapitalizationDays: this.resolveCapitalization(value.penaltyRateType, value.penaltyCapitalizationDays),
      penaltyRateValue: Number(value.penaltyRateValue) / 100,
      creditCurrency: value.creditCurrency, favourBalance,
    };
  }

  private buildAccountRequest(): {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
  } {
    const { firstName, lastName, email, username, password } = this.form.controls.account.getRawValue();
    return {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      username: username.trim(),
      password,
    };
  }

  private resolveCapitalization(
    type: InterestRateType,
    value: InterestRatePeriod | null,
  ): InterestRatePeriod | null {
    return type === InterestRateTypes.EFFECTIVE ? null : value;
  }
}

const passwordsMatchValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password === confirmation ? null : { passwordsMismatch: true };
};
