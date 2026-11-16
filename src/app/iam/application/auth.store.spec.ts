import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '@shared/application/app-error';
import { UserRoles } from '../domain/constants/user-roles.constant';
import { UserStatuses } from '../domain/enums/user-status.enum';
import { AuthSession, SessionUser } from './auth-session';
import { AuthStore } from './auth.store';

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 3,
    storeId: 1,
    username: 'ana.g',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@mail.pe',
    role: UserRoles.CUSTOMER,
    status: UserStatuses.ACTIVE,
    ...overrides,
  };
}

function session(overrides: Partial<SessionUser> = {}): AuthSession {
  return { user: sessionUser(overrides), token: 'opaque-session-token' };
}

function setupStore(): AuthStore {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(AuthStore);
}

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    store = setupStore();
  });

  it('starts without a session, loading or error', () => {
    expect(store.currentUser()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.currentRole()).toBeNull();
    expect(store.currentStoreId()).toBeNull();
    expect(store.isSuperAdmin()).toBe(false);
    expect(store.isPlatformUser()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.errorMessage()).toBeNull();
  });

  it('exposes the authenticated user, role, store and auth flag after setting a session', () => {
    store.setSession(session());

    expect(store.currentUser()).toEqual(sessionUser());
    expect(store.isAuthenticated()).toBe(true);
    expect(store.currentRole()).toBe(UserRoles.CUSTOMER);
    expect(store.currentStoreId()).toBe(1);
    expect(store.isSuperAdmin()).toBe(false);
    expect(store.isPlatformUser()).toBe(false);
  });

  it('derives super admin and platform-user state from a null store', () => {
    store.setSession(
      session({ role: UserRoles.SUPER_ADMIN, storeId: null })
    );

    expect(store.currentRole()).toBe(UserRoles.SUPER_ADMIN);
    expect(store.currentStoreId()).toBeNull();
    expect(store.isSuperAdmin()).toBe(true);
    expect(store.isPlatformUser()).toBe(true);
  });

  it('does not expose the token or password material through public state', () => {
    store.setSession(session());

    expect('token' in store).toBe(false);
    expect('session' in store).toBe(false);
    expect(Object.keys(store.currentUser() ?? {})).not.toContain(
      'passwordHash'
    );
    expect(Object.keys(store.currentUser() ?? {})).not.toContain('password');
  });

  it('clears session, loading and error when clearing the session', () => {
    store.setSession(session());
    store.setLoading(true);
    store.setError(new AppError('AUTH_FAILED', 'Credenciales inválidas'));

    store.clearSession();

    expect(store.currentUser()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.currentRole()).toBeNull();
    expect(store.currentStoreId()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('manages loading and error state independently', () => {
    const error = new AppError('AUTH_FAILED', 'Credenciales inválidas');

    store.setLoading(true);
    store.setError(error);

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBe(error);
    expect(store.errorMessage()).toBe('Credenciales inválidas');

    store.clearError();
    expect(store.error()).toBeNull();

    store.setLoading(false);
    expect(store.isLoading()).toBe(false);
  });

  it('removes a previous error when a new session is established', () => {
    store.setError(new AppError('AUTH_FAILED', 'Credenciales inválidas'));

    store.setSession(session());

    expect(store.error()).toBeNull();
  });
});
