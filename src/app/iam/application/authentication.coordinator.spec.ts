import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@shared/application/app-error';
import {
  TOKEN_STORAGE_PORT,
  TokenStoragePort,
} from '@shared/infrastructure/storage/token-storage.port';
import { UserRoles } from '../domain/constants/user-roles.constant';
import { StoreStatuses } from '../domain/enums/store-status.enum';
import { UserStatuses } from '../domain/enums/user-status.enum';
import { Store } from '../domain/model/store.entity';
import { User } from '../domain/model/user.entity';
import { StoreRepository } from '../domain/repositories/store.repository';
import { UserRepository } from '../domain/repositories/user.repository';
import {
  AUTH_GATEWAY,
  AuthGateway,
  AuthenticationCredentials,
  RegistrationCommand,
} from './auth.gateway';
import { AuthSession, SessionUser } from './auth-session';
import { AuthStore } from './auth.store';
import { AuthenticationCoordinator } from './authentication.coordinator';
import { IAM_STORE_REPOSITORY, TenantStore } from './tenant.store';
import { IAM_USER_REPOSITORY, UserStore } from './user.store';

const CREDENTIALS: AuthenticationCredentials = {
  username: 'ana.g',
  password: 'super-secret-value',
};

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 3,
    storeId: 1,
    username: 'ana.g',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@mail.pe',
    role: UserRoles.STORE_ADMIN,
    status: UserStatuses.ACTIVE,
    ...overrides,
  };
}

function session(overrides: Partial<SessionUser> = {}): AuthSession {
  return { user: sessionUser(overrides), token: 'jwt-token' };
}

function command(): RegistrationCommand {
  return {
    username: 'nuevo.u',
    password: 'registration-secret',
    firstName: 'Nuevo',
    lastName: 'Usuario',
    email: 'nuevo@mail.pe',
    storeId: 1,
  };
}

function userEntity(): User {
  return new User({
    id: 3,
    storeId: 1,
    username: 'ana.g',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@mail.pe',
    role: UserRoles.STORE_ADMIN,
    status: UserStatuses.ACTIVE,
  });
}

function storeEntity(): Store {
  return new Store({
    id: 1,
    businessName: 'Bodega Central',
    taxId: '20123456789',
    address: 'Av. Siempre Viva 742',
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    status: StoreStatuses.ACTIVE,
  });
}

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

interface Harness {
  readonly coordinator: AuthenticationCoordinator;
  readonly authStore: AuthStore;
  readonly userStore: UserStore;
  readonly tenantStore: TenantStore;
  readonly gateway: AuthGateway;
  readonly tokenStorage: TokenStoragePort;
  readonly users: UserRepository;
  readonly stores: StoreRepository;
}

function setupHarness(): Harness {
  const gateway: AuthGateway = {
    signIn: vi.fn(),
    signUp: vi.fn(),
  };
  const tokenStorage: TokenStoragePort = {
    getToken: vi.fn().mockReturnValue(null),
    setToken: vi.fn(),
    removeToken: vi.fn(),
  };
  const users: UserRepository = {
    findById: vi.fn().mockResolvedValue(null),
    findByUsername: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByStoreId: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    update: vi.fn(),
  };
  const stores: StoreRepository = {
    findById: vi.fn().mockResolvedValue(null),
    findByTaxId: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    update: vi.fn(),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: AUTH_GATEWAY, useValue: gateway },
      { provide: TOKEN_STORAGE_PORT, useValue: tokenStorage },
      { provide: IAM_USER_REPOSITORY, useValue: users },
      { provide: IAM_STORE_REPOSITORY, useValue: stores },
    ],
  });

  return {
    coordinator: TestBed.inject(AuthenticationCoordinator),
    authStore: TestBed.inject(AuthStore),
    userStore: TestBed.inject(UserStore),
    tenantStore: TestBed.inject(TenantStore),
    gateway,
    tokenStorage,
    users,
    stores,
  };
}

describe('AuthenticationCoordinator', () => {
  let harness: Harness;

  beforeEach(() => {
    harness = setupHarness();
  });

  it('signs in, stores the token and establishes the session', async () => {
    vi.mocked(harness.gateway.signIn).mockResolvedValue(session());

    const result = await harness.coordinator.signIn(CREDENTIALS);

    expect(harness.gateway.signIn).toHaveBeenCalledWith(CREDENTIALS);
    expect(result).toEqual(session());
    expect(harness.authStore.isAuthenticated()).toBe(true);
    expect(harness.authStore.currentUser()).toEqual(sessionUser());
    expect(harness.authStore.currentRole()).toBe(UserRoles.STORE_ADMIN);
    expect(harness.tokenStorage.setToken).toHaveBeenCalledWith('jwt-token');
    expect(harness.authStore.isLoading()).toBe(false);
    expect(harness.authStore.error()).toBeNull();
  });

  it('keeps loading active while sign-in is pending', async () => {
    const pending = deferred<AuthSession>();
    vi.mocked(harness.gateway.signIn).mockReturnValue(pending.promise);

    const signIn = harness.coordinator.signIn(CREDENTIALS);
    expect(harness.authStore.isLoading()).toBe(true);

    pending.resolve(session());
    await signIn;
    expect(harness.authStore.isLoading()).toBe(false);
  });

  it('does not require a token to establish a verifiable session', async () => {
    vi.mocked(harness.gateway.signIn).mockResolvedValue({
      user: sessionUser(),
    });

    await harness.coordinator.signIn(CREDENTIALS);

    expect(harness.authStore.isAuthenticated()).toBe(true);
    expect(harness.tokenStorage.removeToken).toHaveBeenCalledOnce();
    expect(harness.tokenStorage.setToken).not.toHaveBeenCalled();
  });

  it('rejects an authentication response without a valid identity', async () => {
    vi.mocked(harness.gateway.signIn).mockResolvedValue({
      user: sessionUser({ id: 0 }),
      token: 'jwt-token',
    });

    await expect(harness.coordinator.signIn(CREDENTIALS)).rejects.toMatchObject({
      code: 'IAM_INVALID_AUTH_SESSION',
    });

    expect(harness.authStore.isAuthenticated()).toBe(false);
    expect(harness.authStore.error()?.code).toBe('IAM_INVALID_AUTH_SESSION');
    expect(harness.authStore.isLoading()).toBe(false);
    expect(harness.tokenStorage.setToken).not.toHaveBeenCalled();
  });

  it('rejects a tenant user without a store and accepts a platform super admin', async () => {
    vi.mocked(harness.gateway.signIn).mockResolvedValueOnce({
      user: sessionUser({
        role: UserRoles.CUSTOMER,
        storeId: null,
      }),
    });

    await expect(harness.coordinator.signIn(CREDENTIALS)).rejects.toMatchObject({
      code: 'IAM_INVALID_AUTH_SESSION',
    });

    vi.mocked(harness.gateway.signIn).mockResolvedValueOnce({
      user: sessionUser({
        role: UserRoles.SUPER_ADMIN,
        storeId: null,
      }),
    });

    await harness.coordinator.signIn(CREDENTIALS);

    expect(harness.authStore.isAuthenticated()).toBe(true);
    expect(harness.authStore.isSuperAdmin()).toBe(true);
    expect(harness.authStore.isPlatformUser()).toBe(true);
  });

  it('propagates sign-in failures, records them and stops loading', async () => {
    const error = new AppError('AUTH_FAILED', 'Credenciales inválidas', 401);
    vi.mocked(harness.gateway.signIn).mockRejectedValue(error);

    await expect(harness.coordinator.signIn(CREDENTIALS)).rejects.toBe(error);

    expect(harness.authStore.isAuthenticated()).toBe(false);
    expect(harness.authStore.error()).toBe(error);
    expect(harness.authStore.isLoading()).toBe(false);
    expect(harness.tokenStorage.setToken).not.toHaveBeenCalled();
  });

  it('wraps unexpected sign-in failures in an AppError', async () => {
    vi.mocked(harness.gateway.signIn).mockRejectedValue(new Error('network'));

    await expect(harness.coordinator.signIn(CREDENTIALS)).rejects.toMatchObject({
      code: 'IAM_AUTHENTICATION_FAILED',
      message: 'network',
    });

    expect(harness.authStore.isLoading()).toBe(false);
  });

  it('does not persist credentials in reactive state', async () => {
    vi.mocked(harness.gateway.signIn).mockResolvedValue(session());

    await harness.coordinator.signIn(CREDENTIALS);

    const publicState = JSON.stringify({
      user: harness.authStore.currentUser(),
      users: harness.userStore.users(),
      stores: harness.tenantStore.stores(),
    });

    expect(publicState).not.toContain('super-secret-value');
    expect(Object.keys(harness.authStore.currentUser() ?? {})).not.toContain(
      'password'
    );
    expect(Object.keys(harness.authStore.currentUser() ?? {})).not.toContain(
      'passwordHash'
    );
  });

  it('ignores a stale sign-in that resolves after a newer one', async () => {
    const first = deferred<AuthSession>();
    const second = deferred<AuthSession>();
    vi.mocked(harness.gateway.signIn)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstSignIn = harness.coordinator.signIn(CREDENTIALS);
    const secondSignIn = harness.coordinator.signIn(CREDENTIALS);
    second.resolve({ user: sessionUser({ id: 4, username: 'newer' }) });
    await secondSignIn;
    first.resolve(session({ id: 5, username: 'stale' }));
    await firstSignIn;

    expect(harness.authStore.currentUser()?.username).toBe('newer');
    expect(harness.authStore.isLoading()).toBe(false);
    expect(harness.tokenStorage.setToken).not.toHaveBeenCalled();
  });

  it('does not restore a session when sign-in resolves after sign-out', async () => {
    const pending = deferred<AuthSession>();
    vi.mocked(harness.gateway.signIn).mockReturnValue(pending.promise);

    const signIn = harness.coordinator.signIn(CREDENTIALS);
    harness.coordinator.signOut();
    pending.resolve(session());
    await signIn;

    expect(harness.authStore.isAuthenticated()).toBe(false);
    expect(harness.tokenStorage.setToken).not.toHaveBeenCalled();
    expect(harness.tokenStorage.removeToken).toHaveBeenCalled();
  });

  it('signs up without creating a session or storing a token', async () => {
    vi.mocked(harness.gateway.signUp).mockResolvedValue(sessionUser());

    const result = await harness.coordinator.signUp(command());

    expect(harness.gateway.signUp).toHaveBeenCalledWith(command());
    expect(result).toEqual(sessionUser());
    expect(harness.authStore.isAuthenticated()).toBe(false);
    expect(harness.tokenStorage.setToken).not.toHaveBeenCalled();
    expect(harness.authStore.isLoading()).toBe(false);
  });

  it('propagates sign-up failures and stops loading', async () => {
    const error = new AppError('REGISTRATION_FAILED', 'Usuario duplicado', 409);
    vi.mocked(harness.gateway.signUp).mockRejectedValue(error);

    await expect(harness.coordinator.signUp(command())).rejects.toBe(error);

    expect(harness.authStore.error()).toBe(error);
    expect(harness.authStore.isAuthenticated()).toBe(false);
    expect(harness.authStore.isLoading()).toBe(false);
  });

  it('does not accept a role in the registration command', () => {
    const payload = command();

    expect(Object.keys(payload)).not.toContain('role');
    expect(Object.keys(payload)).not.toContain('userType');
  });

  it('signs out locally and clears every session-scoped state', async () => {
    vi.mocked(harness.users.findByStoreId).mockResolvedValue([userEntity()]);
    vi.mocked(harness.stores.findAll).mockResolvedValue([storeEntity()]);
    vi.mocked(harness.gateway.signIn).mockResolvedValue(session());
    await harness.coordinator.signIn(CREDENTIALS);
    await harness.userStore.loadUsersByStore(1);
    await harness.tenantStore.loadStores();

    harness.coordinator.signOut();

    expect(harness.tokenStorage.removeToken).toHaveBeenCalled();
    expect(harness.authStore.isAuthenticated()).toBe(false);
    expect(harness.authStore.currentUser()).toBeNull();
    expect(harness.authStore.error()).toBeNull();
    expect(harness.userStore.users()).toEqual([]);
    expect(harness.userStore.selectedUser()).toBeNull();
    expect(harness.tenantStore.stores()).toEqual([]);
    expect(harness.tenantStore.selectedStore()).toBeNull();
  });

  it('clears previous user and store state when a new session starts', async () => {
    vi.mocked(harness.users.findByStoreId).mockResolvedValue([userEntity()]);
    vi.mocked(harness.stores.findAll).mockResolvedValue([storeEntity()]);
    vi.mocked(harness.gateway.signIn).mockResolvedValue(session());
    await harness.userStore.loadUsersByStore(1);
    await harness.tenantStore.loadStores();

    await harness.coordinator.signIn(CREDENTIALS);

    expect(harness.userStore.users()).toEqual([]);
    expect(harness.tenantStore.stores()).toEqual([]);
  });
});
