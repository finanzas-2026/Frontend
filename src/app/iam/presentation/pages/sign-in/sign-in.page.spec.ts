import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@shared/application/app-error';
import { UserRole, UserRoles } from '../../../domain/constants/user-roles.constant';
import { UserStatuses } from '../../../domain/enums/user-status.enum';
import { AuthSession } from '../../../application/auth-session';
import { AuthStore } from '../../../application/auth.store';
import { AuthenticationCoordinator } from '../../../application/authentication.coordinator';
import { SignInPage } from './sign-in.page';

const SESSION: AuthSession = {
  user: {
    id: 1,
    storeId: null,
    username: 'superadmin',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'admin@sys.pe',
    role: UserRoles.SUPER_ADMIN,
    status: UserStatuses.ACTIVE,
  },
  token: 'test-token',
};

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SignInPage', () => {
  let fixture: ComponentFixture<SignInPage>;
  let component: SignInPage;
  let coordinator: { signIn: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let authStore: {
    isLoading: WritableSignal<boolean>;
    isAuthenticated: WritableSignal<boolean>;
    isSuperAdmin: WritableSignal<boolean>;
    currentRole: WritableSignal<UserRole | null>;
  };

  beforeEach(async () => {
    coordinator = { signIn: vi.fn() };
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    authStore = {
      isLoading: signal(false),
      isAuthenticated: signal(false),
      isSuperAdmin: signal(false),
      currentRole: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideNoopAnimations(),
        { provide: AuthenticationCoordinator, useValue: coordinator },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignInPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function submitButton(): HTMLButtonElement {
    const button = host().querySelector<HTMLButtonElement>('.submit-button');
    if (!button) {
      throw new Error('No se encontró el botón de inicio de sesión.');
    }
    return button;
  }

  function fill(username: string, password: string): void {
    component.form.setValue({ username, password });
    fixture.detectChanges();
  }

  it('renders the username, password and submit controls', () => {
    const text = host().textContent as string;

    expect(text).toContain('Iniciar sesión');
    expect(
      host().querySelector('input[formcontrolname="username"]')
    ).not.toBeNull();
    expect(
      host().querySelector('input[formcontrolname="password"]')
    ).not.toBeNull();
    expect(submitButton().textContent).toContain('Iniciar sesión');
  });

  it('shows required validation and does not call Application when empty', async () => {
    submitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.invalid).toBe(true);
    expect(coordinator.signIn).not.toHaveBeenCalled();
    expect(host().textContent).toContain('El usuario es obligatorio.');
    expect(host().textContent).toContain('La contraseña es obligatoria.');
  });

  it('sends trimmed credentials through AuthenticationCoordinator', async () => {
    coordinator.signIn.mockResolvedValue(SESSION);
    authStore.isAuthenticated.set(true);
    fill('  superadmin  ', 'secret');

    submitButton().click();
    await fixture.whenStable();

    expect(coordinator.signIn).toHaveBeenCalledWith({
      username: 'superadmin',
      password: 'secret',
    });
  });

  it('disables the submit button and displays progress while pending', async () => {
    const pending = deferred<AuthSession>();
    coordinator.signIn.mockReturnValue(pending.promise);
    fill('superadmin', 'secret');

    const submission = component.onSubmit();
    fixture.detectChanges();

    expect(component.isBusy()).toBe(true);
    expect(submitButton().disabled).toBe(true);
    expect(host().textContent).toContain('Autenticando...');

    pending.resolve(SESSION);
    authStore.isAuthenticated.set(true);
    await submission;
    fixture.detectChanges();

    expect(component.isBusy()).toBe(false);
  });

  it('shows a generic message for invalid credentials', async () => {
    coordinator.signIn.mockRejectedValue(
      new AppError('INVALID_CREDENTIALS', 'Detalle técnico', 401)
    );
    fill('superadmin', 'wrong');

    submitButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host().textContent).toContain(
      'Usuario o contraseña incorrectos.'
    );
    expect(host().textContent).not.toContain('Detalle técnico');
  });

  it('shows the suspension message when Application reports a suspended store', async () => {
    coordinator.signIn.mockRejectedValue(
      new AppError('STORE_SUSPENDED', 'Store inactive', 403)
    );
    fill('store.admin', 'secret');

    submitButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host().textContent).toContain(
      'La cuenta de tu tienda se encuentra suspendida.'
    );
  });

  it('distinguishes communication failures from invalid credentials', async () => {
    coordinator.signIn.mockRejectedValue(
      new AppError('SERVER_ERROR', 'Internal detail', 503)
    );
    fill('superadmin', 'secret');

    submitButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host().textContent).toContain(
      'No se pudo conectar con el servidor.'
    );
    expect(host().textContent).not.toContain('Internal detail');
  });

  it('does not disguise unexpected errors as invalid credentials', async () => {
    coordinator.signIn.mockRejectedValue(
      new AppError('IAM_INVALID_AUTH_SESSION', 'Invalid session')
    );
    fill('superadmin', 'secret');

    submitButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host().textContent).toContain(
      'No se pudo iniciar sesión. Intenta nuevamente.'
    );
    expect(host().textContent).not.toContain(
      'Usuario o contraseña incorrectos.'
    );
  });

  it('navigates to tenant management after a super admin signs in', async () => {
    coordinator.signIn.mockResolvedValue(SESSION);
    authStore.isAuthenticated.set(true);
    authStore.isSuperAdmin.set(true);
    authStore.currentRole.set(UserRoles.SUPER_ADMIN);
    fill('superadmin', 'secret');

    submitButton().click();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/iam/tenants');
  });

  it('toggles password visibility without changing the form value', () => {
    fill('superadmin', 'secret');
    const passwordInput =
      host().querySelector<HTMLInputElement>(
        'input[formcontrolname="password"]'
      );
    expect(passwordInput?.type).toBe('password');

    const toggle = host().querySelector<HTMLButtonElement>('.password-toggle');
    toggle?.click();
    fixture.detectChanges();

    expect(component.showPassword()).toBe(true);
    expect(passwordInput?.type).toBe('text');
    expect(component.form.controls.password.value).toBe('secret');
  });

  it('clears the password after the operation completes', async () => {
    coordinator.signIn.mockRejectedValue(new AppError('AUTH_FAILED', 'fail', 401));
    fill('superadmin', 'secret');

    submitButton().click();
    await fixture.whenStable();

    expect(component.form.controls.password.value).toBe('');
  });
});
