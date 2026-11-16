import { Service, inject } from '@angular/core';
import { AppError } from '@shared/application/app-error';
import { TOKEN_STORAGE_PORT } from '@shared/infrastructure/storage/token-storage.port';
import { UserRoles, isUserRole } from '../domain/constants/user-roles.constant';
import {
  AUTH_GATEWAY,
  AuthenticationCredentials,
  RegistrationCommand,
} from './auth.gateway';
import { AuthSession, SessionUser } from './auth-session';
import { AuthStore } from './auth.store';
import { TenantStore } from './tenant.store';
import { UserStore } from './user.store';

/**
 * Orchestrates authentication flows and their associated Application state.
 *
 * It does not know about HTTP, routes, forms or visual notifications. The
 * gateway and the token storage are consumed through ports.
 */
@Service()
export class AuthenticationCoordinator {
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly tokenStorage = inject(TOKEN_STORAGE_PORT);
  private readonly authStore = inject(AuthStore);
  private readonly userStore = inject(UserStore);
  private readonly tenantStore = inject(TenantStore);
  private authRequestSequence = 0;

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
      this.authStore.setSession(session);
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

  /**
   * Local sign-out. No revocation endpoint exists in the current backend, so
   * the session is invalidated in memory only.
   */
  signOut(): void {
    this.authRequestSequence += 1;
    this.tokenStorage.removeToken();
    this.authStore.clearSession();
    this.userStore.clearState();
    this.tenantStore.clearState();
  }

  private startAuthRequest(): number {
    this.authRequestSequence += 1;
    this.authStore.setLoading(true);
    this.authStore.clearError();
    return this.authRequestSequence;
  }

  private isCurrentAuthRequest(request: number): boolean {
    return request === this.authRequestSequence;
  }

  private finishAuthRequest(request: number): void {
    if (this.isCurrentAuthRequest(request)) {
      this.authStore.setLoading(false);
    }
  }

  private failAuthRequest(request: number, error: unknown): AppError {
    const appError = toAppError(error);

    if (this.isCurrentAuthRequest(request)) {
      this.authStore.setError(appError);
    }

    return appError;
  }
}

/**
 * Rejects a gateway response that cannot prove a successful authentication.
 * It never fabricates the missing identity or token.
 */
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
