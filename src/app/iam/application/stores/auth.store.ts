import { computed, inject, signal, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { environment } from '../../../../environments/environment';
import { UserRole, UserRoles } from '../../domain/constants/user-roles.constant';
import { StoreStatuses } from '../../domain/enums/store-status.enum';
import { UserStatuses } from '../../domain/enums/user-status.enum';
import { Store } from '../../domain/model/store.entity';
import { User } from '../../domain/model/user.entity';
import { StoreApi } from '../../infrastructure/api/store.api';
import { UserApi } from '../../infrastructure/api/user.api';
import { AuthSession } from '../models/auth-session';
import { TenantStore } from './tenant.store';

export interface SignInCredentials {
  readonly identifier: string;
  readonly password: string;
}

/** Data required to register a store and its administrator account. */
export interface StoreRegistrationCommand {
  readonly businessName: string;
  readonly taxId: string;
  readonly address: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

/**
 * Authentication state and simulated session orchestration.
 *
 * It is the single source of truth for the session. Authentication is a
 * development mock over JSON Server; it is not real security.
 */
@Service()
export class AuthStore {
  private readonly userApi = inject(UserApi);
  private readonly storeApi = inject(StoreApi);
  private readonly tenantStore = inject(TenantStore);

  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly currentUser = computed(() => this.sessionState());
  readonly currentRole = computed(() => this.sessionState()?.userType ?? null);
  readonly currentStoreId = computed(() => this.sessionState()?.storeId ?? null);

  constructor() {
    this.restoreSession();
  }

  async signIn(credentials: SignInCredentials): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const user = await this.findValidUser(credentials);
      const store = await this.findActiveStore(user);
      const session = toAuthSession(user);

      this.sessionState.set(session);
      this.persistSession(session);
      this.tenantStore.setActiveTenant(store);
    } catch (error) {
      this.sessionState.set(null);
      this.clearPersistedSession();
      this.tenantStore.clearActiveTenant();
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  signOut(): void {
    this.sessionState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
    this.clearPersistedSession();
    this.tenantStore.clearActiveTenant();
  }

  /**
   * Registers a store and its STORE_ADMIN account.
   *
   * JSON Server has no transactions: the store is created first, and if the
   * account cannot be created, the store is rolled back on a best-effort basis.
   */
  async signUpStore(command: StoreRegistrationCommand): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      await this.ensureAccountAvailable(command);
      const store = await this.createStore(command);
      await this.createStoreAdmin(command, store.id);
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  restoreSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.sessionStorage.getItem(environment.sessionStorageKey);
    if (!raw) {
      return;
    }

    const session = parseSession(raw);
    if (!session) {
      this.clearPersistedSession();
      return;
    }

    this.sessionState.set(session);
  }

  private async findValidUser(credentials: SignInCredentials): Promise<User> {
    const identifier = credentials.identifier.trim();
    const users = await firstValueFrom(
      identifier.includes('@')
        ? this.userApi.searchByEmail(identifier)
        : this.userApi.searchByUsername(identifier),
    );
    const user = users[0];

    if (!user || !this.matchesMockPassword(user, credentials.password)) {
      throw new AppError('INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos.', 401);
    }

    if (user.status !== UserStatuses.ACTIVE) {
      throw new AppError('ACCOUNT_INACTIVE', 'La cuenta de usuario no está activa.', 403);
    }

    return user;
  }

  private matchesMockPassword(user: User, password: string): boolean {
    // db.json stores mock passwords as plain text in `password_hash`, not as
    // real hashes. Equality is only valid for this development dataset.
    // TODO(BACKEND-AUTH): Reemplazar la autenticación simulada
    // por autenticación gestionada por el backend.
    // El almacenamiento actual no es apto para credenciales reales.
    return user.passwordHash === password;
  }

  private async findActiveStore(user: User): Promise<Store | null> {
    if (user.storeId === null) {
      return null;
    }

    const store = await firstValueFrom(this.storeApi.getById(user.storeId));
    if (store.status !== StoreStatuses.ACTIVE) {
      throw new AppError('STORE_INACTIVE', 'La tienda asociada no está activa.', 403);
    }

    return store;
  }

  private async ensureAccountAvailable(command: StoreRegistrationCommand): Promise<void> {
    const [byUsername, byEmail] = await Promise.all([
      firstValueFrom(this.userApi.searchByUsername(command.username.trim())),
      firstValueFrom(this.userApi.searchByEmail(command.email.trim())),
    ]);

    if (byUsername.length > 0) {
      throw new AppError('USERNAME_TAKEN', 'El nombre de usuario ya está registrado.', 409);
    }

    if (byEmail.length > 0) {
      throw new AppError('EMAIL_TAKEN', 'El correo electrónico ya está registrado.', 409);
    }
  }

  private async createStore(command: StoreRegistrationCommand): Promise<Store> {
    return firstValueFrom(
      this.storeApi.create({
        // TODO(IAM-PERSISTENCE): Sustituir los IDs temporales
        // por identificadores generados por la persistencia.
        // Revisar el flujo de creación de Store y User.
        id: Date.now(),
        businessName: command.businessName.trim(),
        taxId: command.taxId.trim(),
        address: command.address.trim(),
        createdAt: new Date().toISOString(),
        status: StoreStatuses.ACTIVE,
      }),
    );
  }

  private async createStoreAdmin(
    command: StoreRegistrationCommand,
    storeId: number,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.userApi.create({
          id: Date.now(),
          storeId,
          username: command.username.trim(),
          // JSON Server mock: `password_hash` holds the development
          // credential as plain text. Hashing belongs to the future backend.
          passwordHash: command.password,
          firstName: command.firstName.trim(),
          lastName: command.lastName.trim(),
          email: command.email.trim(),
          userType: UserRoles.STORE_ADMIN,
          status: UserStatuses.ACTIVE,
        }),
      );
    } catch (error) {
      const reverted = await this.rollbackStore(storeId);
      throw new AppError(
        'REGISTRATION_INCOMPLETE',
        reverted
          ? 'No se pudo crear la cuenta administradora. El registro fue revertido.'
          : 'La tienda fue creada, pero la cuenta administradora no. Contacta al administrador.',
        500,
        error,
      );
    }
  }

  private async rollbackStore(storeId: number): Promise<boolean> {
    try {
      await firstValueFrom(this.storeApi.delete(storeId));
      return true;
    } catch {
      return false;
    }
  }

  private persistSession(session: AuthSession): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.setItem(environment.sessionStorageKey, JSON.stringify(session));
  }

  private clearPersistedSession(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.removeItem(environment.sessionStorageKey);
  }
}

function toAuthSession(user: User): AuthSession {
  return {
    userId: user.id,
    username: user.username,
    userType: user.userType,
    storeId: user.storeId,
  };
}

function parseSession(raw: string): AuthSession | null {
  try {
    const value = JSON.parse(raw) as Partial<AuthSession>;
    if (!isValidSession(value)) {
      return null;
    }
    return {
      userId: value.userId,
      username: value.username,
      userType: value.userType,
      storeId: value.storeId,
    };
  } catch {
    return null;
  }
}

function isValidSession(value: Partial<AuthSession>): value is AuthSession {
  return (
    isPositiveInteger(value.userId) &&
    typeof value.username === 'string' &&
    value.username.trim().length > 0 &&
    isUserRole(value.userType) &&
    isStoreId(value.storeId)
  );
}

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    Object.values(UserRoles).includes(value as UserRole)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isStoreId(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación de IAM.';
}
