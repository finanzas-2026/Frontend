import { Service, computed, signal } from '@angular/core';
import { AppError } from '@shared/application/app-error';
import { UserRoles } from '../domain/constants/user-roles.constant';
import { AuthSession, SessionUser } from './auth-session';

/**
 * Reactive authentication state.
 *
 * It holds the active session privately and exposes only read-only views. The
 * token is never exposed through a public signal and credentials are never
 * stored.
 */
@Service()
export class AuthStore {
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<AppError | null>(null);

  readonly currentUser = computed<SessionUser | null>(
    () => this.sessionState()?.user ?? null
  );
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);
  readonly currentStoreId = computed(() => this.currentUser()?.storeId ?? null);
  readonly isSuperAdmin = computed(
    () => this.currentRole() === UserRoles.SUPER_ADMIN
  );
  readonly isPlatformUser = computed(
    () => this.currentUser()?.storeId === null
  );
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly errorMessage = computed(() => this.errorState()?.message ?? null);

  setSession(session: AuthSession): void {
    this.sessionState.set(session);
    this.errorState.set(null);
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
  }

  setLoading(isLoading: boolean): void {
    this.loadingState.set(isLoading);
  }

  setError(error: AppError | null): void {
    this.errorState.set(error);
  }

  clearError(): void {
    this.errorState.set(null);
  }
}
