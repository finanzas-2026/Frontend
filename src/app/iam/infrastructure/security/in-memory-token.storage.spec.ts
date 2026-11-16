import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryTokenStorage } from './in-memory-token.storage';

function setupStorage(): InMemoryTokenStorage {
  TestBed.configureTestingModule({
    providers: [InMemoryTokenStorage],
  });

  return TestBed.inject(InMemoryTokenStorage);
}

describe('InMemoryTokenStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts without a token', () => {
    expect(setupStorage().getToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    const storage = setupStorage();

    storage.setToken('jwt-session-token');

    expect(storage.getToken()).toBe('jwt-session-token');
  });

  it('removes the stored token', () => {
    const storage = setupStorage();
    storage.setToken('jwt-session-token');

    storage.removeToken();

    expect(storage.getToken()).toBeNull();
  });

  it('treats an empty token as no session', () => {
    const storage = setupStorage();
    storage.setToken('jwt-session-token');

    storage.setToken('');

    expect(storage.getToken()).toBeNull();
  });

  it('never writes to or reads from browser storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

    const storage = setupStorage();
    storage.setToken('jwt-session-token');
    storage.getToken();
    storage.removeToken();

    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});
