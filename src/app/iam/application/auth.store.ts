import { Service, computed, inject, signal } from '@angular/core';
import { AppError } from '@shared/application/app-error';
import { TOKEN_STORAGE_PORT } from '@shared/infrastructure/storage/token-storage.port';
import { UserRoles, isUserRole } from '../domain/constants/user-roles.constant';
import { AuthSession, SessionUser } from './auth-session';
import { AUTH_GATEWAY, AuthenticationCredentials, RegistrationCommand } from './auth.gateway';
import { UserStore } from './user.store';
import { TenantStore } from './tenant.store';

/**
 * Reactive authentication state and use-case orchestration.
 *
 * This is the single source of truth for the session. It consumes the
 * `AuthGateway` port and never depends on Infrastructure implementations.
 */
@Service()
export class AuthStore {
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly tokenStorage = inject(TOKEN_STORAGE_PORT);
  private readonly userStore = inject(UserStore);
  private readonly tenantStore = inject(TenantStore);

  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<AppError | null>(null);
  private authRequestSequence = 0;

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

  async signIn(credentials: AuthenticationCredentials): Promise<AuthSession> {
    const request = this.startAuthRequest();

    try {
      const session = requireValidSession(await this.gateway.signIn(credentials));

      if (!this.isCurrentAuthRequest(request)) {
        return session;
      }

      if (session.token) {
        this.tokenStorage.setToken(session.token);
      } else {
        this.tokenStorage.removeToken();
      }

      this.userStore.clearState();
      this.tenantStore.clearState();
      this.sessionState.set(session);
      this.errorState.set(null);
      return session;
    } catch (error) {
      throw this.failAuthRequest(request, error);
    } finally {
      this.finishAuthRequest(request);
    }
  }

  async signUp(command: RegistrationCommand): Promise<SessionUser> {
    const request = this.startAuthRequest();

    try {
      return await this.gateway.signUp(command);
    } catch (error) {
      throw this.failAuthRequest(request, error);
    } finally {
      this.finishAuthRequest(request);
    }
  }

  signOut(): void {
    this.authRequestSequence += 1;
    this.tokenStorage.removeToken();
    this.sessionState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
    this.userStore.clearState();
    this.tenantStore.clearState();
  }

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

  private startAuthRequest(): number {
    this.authRequestSequence += 1;
    this.loadingState.set(true);
    this.errorState.set(null);
    return this.authRequestSequence;
  }

  private isCurrentAuthRequest(request: number): boolean {
    return request === this.authRequestSequence;
  }

  private finishAuthRequest(request: number): void {
    if (this.isCurrentAuthRequest(request)) {
      this.loadingState.set(false);
    }
  }

  private failAuthRequest(request: number, error: unknown): AppError {
    const appError = toAppError(error);

    if (this.isCurrentAuthRequest(request)) {
      this.errorState.set(appError);
    }

    return appError;
  }
}

function requireValidSession(session: AuthSession): AuthSession {
  const user = session?.user;

  if (!isValidIdentity(user) || !isValidStore(user)) {
    throw new AppError(
      'IAM_INVALID_AUTH_SESSION',
      'La respuesta de autenticación no contiene una identidad válida.'
    );
  }

  return session;
}

function isValidIdentity(user: SessionUser | undefined): user is SessionUser {
  return (
    !!user &&
    Number.isInteger(user.id) &&
    user.id > 0 &&
    isUserRole(user.role)
  );
}

function isValidStore(user: SessionUser): boolean {
  if (user.storeId === null) {
    return user.role === UserRoles.SUPER_ADMIN;
  }

  return Number.isInteger(user.storeId) && user.storeId > 0;
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    'IAM_AUTHENTICATION_FAILED',
    error instanceof Error
      ? error.message
      : 'No se pudo completar la operación de autenticación.'
  );
}