import { computed, signal, Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { environment } from '../../../../environments/environment';
import { UserRole, UserRoles } from '../../domain/constants/user-roles.constant';
import { AuthSession } from '../models/auth-session';
import { AuthApi } from '../../infrastructure/api/auth.api';
import { AuthIdentityDto, SignInResponseDto } from '../../infrastructure/dto/auth.dto';
import { StoreApi } from '../../infrastructure/api/store.api';
import { CreateStoreRequest } from '../../infrastructure/resources/store.resource';

export interface SignInCredentials {
  readonly identifier: string;
  readonly password: string;
}

export interface StoreRegistrationCommand {
  readonly businessName: string;
  readonly taxId: string;
  readonly address: string;
  readonly phoneNumber?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

interface StoredSession {
  readonly token: string;
  readonly identity: AuthIdentityDto;
}

/** Owns the verified JWT session and identity for the active browser tab. */
@Service()
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly storeApi = inject(StoreApi);
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly tokenState = signal<string | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly initialization: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly currentUser = computed(() => this.sessionState());
  readonly currentRole = computed(() => this.sessionState()?.userType ?? null);
  readonly currentStoreId = computed(() => this.sessionState()?.storeId ?? null);

  constructor() {
    this.initialization = this.restoreAndVerifySession();
  }

  /** Token access is limited to the HTTP authorization interceptor. */
  accessToken(): string | null {
    return this.tokenState();
  }

  initialize(): Promise<void> {
    return this.initialization;
  }

  async signIn(credentials: SignInCredentials): Promise<void> {
    await this.initialize();
    this.loadingState.set(true);
    this.errorState.set(null);
    this.clearSession();

    try {
      const login = await firstValueFrom(
        this.authApi.signIn(credentials.identifier.trim(), credentials.password),
      );
      if (!isValidLogin(login)) {
        throw new AppError('INVALID_AUTH_RESPONSE', 'La respuesta de inicio de sesión no es válida.', 502);
      }

      this.tokenState.set(login.token);
      const identity = await firstValueFrom(this.authApi.me(login.token));
      if (!isValidIdentity(identity)) {
        throw new AppError('INVALID_AUTH_RESPONSE', 'La identidad autenticada no es válida.', 502);
      }
      this.setSession(identity, login.token);
    } catch (error) {
      this.clearSession();
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async signUpStore(command: StoreRegistrationCommand): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      const request: CreateStoreRequest = {
        business_name: command.businessName.trim(),
        tax_id: command.taxId.trim(),
        address: command.address.trim(),
        phone_number: command.phoneNumber?.trim() || undefined,
        admin: {
          first_name: command.firstName.trim(),
          last_name: command.lastName.trim(),
          email: command.email.trim(),
          username: command.username.trim(),
          password: command.password,
        },
      };
      await firstValueFrom(this.storeApi.create(request));
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  signOut(): void {
    this.loadingState.set(false);
    this.errorState.set(null);
    this.clearSession();
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async restoreAndVerifySession(): Promise<void> {
    if (typeof window === 'undefined') return;

    const stored = parseStoredSession(window.sessionStorage.getItem(environment.sessionStorageKey));
    if (!stored) {
      window.sessionStorage.removeItem(environment.sessionStorageKey);
      return;
    }

    this.tokenState.set(stored.token);
    try {
      const identity = await firstValueFrom(this.authApi.me());
      if (!isValidIdentity(identity)) {
        throw new AppError('INVALID_AUTH_RESPONSE', 'La identidad autenticada no es válida.', 502);
      }
      this.setSession(identity, stored.token);
    } catch {
      this.clearSession();
    }
  }

  private setSession(identity: AuthIdentityDto, token: string): void {
    const session: AuthSession = {
      userId: identity.userId,
      username: identity.username,
      email: identity.email,
      userType: identity.userType,
      storeId: identity.storeId ?? null,
    };
    this.sessionState.set(session);
    this.tokenState.set(token);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        environment.sessionStorageKey,
        JSON.stringify({ token, identity }),
      );
    }
  }

  private clearSession(): void {
    this.sessionState.set(null);
    this.tokenState.set(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(environment.sessionStorageKey);
    }
  }
}

function parseStoredSession(raw: string | null): StoredSession | null {
  if (raw === null) return null;
  try {
    const stored = JSON.parse(raw) as Partial<StoredSession>;
    return typeof stored.token === 'string' && stored.token.length > 0 && isValidStoredIdentity(stored.identity)
      ? { token: stored.token, identity: stored.identity }
      : null;
  } catch {
    return null;
  }
}

function isValidLogin(value: Partial<SignInResponseDto>): value is SignInResponseDto {
  return typeof value.token === 'string' && value.token.length > 0 && isValidIdentity(value);
}

function isValidIdentity(value: unknown): value is AuthIdentityDto {
  if (value === null || typeof value !== 'object') return false;
  const identity = value as Partial<AuthIdentityDto>;
  return isPositiveInteger(identity.userId) &&
    typeof identity.username === 'string' && identity.username.trim().length > 0 &&
    typeof identity.email === 'string' && identity.email.trim().includes('@') &&
    isUserRole(identity.userType) &&
    (identity.storeId == null || isPositiveInteger(identity.storeId));
}

function isValidStoredIdentity(value: unknown): value is AuthIdentityDto {
  if (isValidIdentity(value)) return true;
  if (value === null || typeof value !== 'object') return false;
  const identity = value as Partial<AuthIdentityDto>;
  return isPositiveInteger(identity.userId) &&
    typeof identity.username === 'string' && identity.username.trim().length > 0 &&
    isUserRole(identity.userType) &&
    (identity.storeId == null || isPositiveInteger(identity.storeId));
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.values(UserRoles).includes(value as UserRole);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación de autenticación.';
}
