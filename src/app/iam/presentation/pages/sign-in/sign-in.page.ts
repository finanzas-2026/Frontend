import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AppError } from '@shared/application/app-error';
import { AuthStore } from '../../../application/auth.store';
import { AuthenticationCoordinator } from '../../../application/authentication.coordinator';

const SUSPENDED_STORE_CODES = new Set([
  'STORE_SUSPENDED',
  'IAM_STORE_SUSPENDED',
  'STORE_INACTIVE',
  'ACCOUNT_SUSPENDED',
]);

const INVALID_CREDENTIAL_CODES = new Set([
  'AUTH_FAILED',
  'INVALID_CREDENTIALS',
  'INVALID_LOGIN',
]);

const SUSPENSION_MESSAGE =
  'La cuenta de tu tienda se encuentra suspendida. Contacta al administrador del sistema.';
const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos.';
const COMMUNICATION_MESSAGE =
  'No se pudo conectar con el servidor. Intenta nuevamente.';
const UNEXPECTED_MESSAGE = 'No se pudo iniciar sesión. Intenta nuevamente.';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-sign-in',
  styleUrl: './sign-in.page.scss',
  templateUrl: './sign-in.page.html',
})
export class SignInPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly coordinator = inject(AuthenticationCoordinator);
  private readonly router = inject(Router);

  readonly authStore = inject(AuthStore);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly isBusy = computed(
    () => this.isSubmitting() || this.authStore.isLoading()
  );

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorMessage.set(null);

    if (this.form.invalid || this.isBusy()) {
      return;
    }

    this.isSubmitting.set(true);
    const { username, password } = this.form.getRawValue();

    try {
      await this.coordinator.signIn({ username: username.trim(), password });

      if (!this.authStore.isAuthenticated()) {
        this.errorMessage.set(UNEXPECTED_MESSAGE);
        return;
      }

      await this.router.navigateByUrl(this.destinationForCurrentRole());
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.form.controls.password.reset();
      this.isSubmitting.set(false);
    }
  }

  private destinationForCurrentRole(): string {
    return this.authStore.isSuperAdmin() ? '/iam/tenants' : '/';
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof AppError)) {
    return UNEXPECTED_MESSAGE;
  }

  if (SUSPENDED_STORE_CODES.has(error.code)) {
    return SUSPENSION_MESSAGE;
  }

  if (error.httpStatus === 0 || (error.httpStatus ?? 0) >= 500) {
    return COMMUNICATION_MESSAGE;
  }

  if (
    error.httpStatus === 401 ||
    error.httpStatus === 403 ||
    INVALID_CREDENTIAL_CODES.has(error.code)
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  return UNEXPECTED_MESSAGE;
}
