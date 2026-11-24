import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '../../../application/stores/auth.store';
import { UiIconComponent } from '@shared/index';
import { UserRoles } from '../../../domain/constants/user-roles.constant';
import { AuthBrandPanel } from '../../components/auth-brand-panel/auth-brand-panel';
import { TouchedErrorStateMatcher } from '../../utils/touched-error-state-matcher';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AuthBrandPanel,
    UiIconComponent,
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: TouchedErrorStateMatcher },
  ],
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.css', '../../styles/auth-page.css'],
})
export class SignInPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authStore = inject(AuthStore);
  readonly showPassword = signal(false);
  readonly brandFeatures = [
    'Operación independiente por tienda',
    'Acceso según el rol asignado',
    'Información centralizada y trazable',
  ];

  readonly form = this.formBuilder.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    await this.authStore.initialize();
    this.authStore.clearError();

    if (this.authStore.isAuthenticated()) {
      void this.router.navigateByUrl(this.destination());
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.authStore.isLoading()) {
      return;
    }

    const { identifier, password } = this.form.getRawValue();

    try {
      await this.authStore.signIn({ identifier: identifier.trim(), password });
      await this.router.navigateByUrl(this.destination());
    } catch {
      // AuthStore already exposes a user-facing error message.
    } finally {
      this.form.controls.password.reset();
    }
  }

  private destination(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return safeReturnUrl(returnUrl) ?? this.destinationForRole();
  }

  private destinationForRole(): string {
    switch (this.authStore.currentRole()) {
      case UserRoles.SUPER_ADMIN:
        return '/stores';
      case UserRoles.STORE_ADMIN:
        return '/sales/pos';
      case UserRoles.CUSTOMER:
        return '/financing/simulator';
      default:
        return '/iam/sign-in';
    }
  }
}

function safeReturnUrl(value: string | null): string | null {
  return value !== null && value.startsWith('/') && !value.startsWith('//')
    ? value
    : null;
}
