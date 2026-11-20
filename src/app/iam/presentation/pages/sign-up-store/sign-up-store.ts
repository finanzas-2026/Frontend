import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
  AuthStore,
  StoreRegistrationCommand,
} from '../../../application/stores/auth.store';
import { UserRoles } from '../../../domain/constants/user-roles.constant';
import { AuthBrandPanel } from '../../components/auth-brand-panel/auth-brand-panel';
import { TouchedErrorStateMatcher } from '../../utils/touched-error-state-matcher';

const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'app-sign-up-store',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AuthBrandPanel,
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: TouchedErrorStateMatcher },
  ],
  templateUrl: './sign-up-store.html',
  styleUrls: ['./sign-up-store.css', '../../styles/auth-page.css'],
})
export class SignUpStorePage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly authStore = inject(AuthStore);
  readonly step = signal(1);
  readonly showPassword = signal(false);
  readonly isSuccess = signal(false);
  readonly assignedRole = UserRoles.STORE_ADMIN;
  readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  readonly brandFeatures = [
    'Datos del establecimiento',
    'Cuenta administradora',
    'Confirmación y listo',
  ];

  readonly steps = [
    { number: 1, label: 'Establecimiento' },
    { number: 2, label: 'Cuenta administradora' },
    { number: 3, label: 'Confirmación' },
  ];

  readonly form = this.formBuilder.nonNullable.group({
    store: this.formBuilder.nonNullable.group({
      businessName: ['', [Validators.required]],
      taxId: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      address: ['', [Validators.required]],
    }),
    admin: this.formBuilder.nonNullable.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        username: ['', [Validators.required]],
        password: [
          '',
          [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    ),
  });

  get storeForm() {
    return this.form.controls.store;
  }

  get adminForm() {
    return this.form.controls.admin;
  }

  ngOnInit(): void {
    this.authStore.clearError();
  }

  next(): void {
    if (this.step() === 1) {
      this.storeForm.markAllAsTouched();
      if (this.storeForm.valid) {
        this.step.set(2);
      }
      return;
    }

    if (this.step() === 2) {
      this.adminForm.markAllAsTouched();
      if (this.adminForm.valid) {
        this.step.set(3);
      }
    }
  }

  back(): void {
    this.step.update((step) => Math.max(1, step - 1));
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (this.step() < 3) {
      this.next();
      return;
    }
    void this.confirm();
  }

  async confirm(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.authStore.isLoading()) {
      return;
    }

    const { store, admin } = this.form.getRawValue();
    const command: StoreRegistrationCommand = {
      businessName: store.businessName,
      taxId: store.taxId,
      address: store.address,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      username: admin.username,
      password: admin.password,
    };

    try {
      await this.authStore.signUpStore(command);
      this.isSuccess.set(true);
    } catch {
      // AuthStore already exposes a user-facing error message.
    }
  }
}

const passwordsMatchValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password === confirmation ? null : { passwordsMismatch: true };
};
