import { Service } from '@angular/core';
import { TokenStoragePort } from '@shared/infrastructure/storage/token-storage.port';

/**
 * Non-persistent session token storage.
 *
 * The token lives only in the Angular service instance. It is never written to
 * `localStorage`, `sessionStorage`, cookies or any other browser persistence.
 * Application will wire it to `TOKEN_STORAGE_PORT` when the session flow is
 * implemented; the shared interceptor is intentionally left untouched.
 */
@Service()
export class InMemoryTokenStorage implements TokenStoragePort {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token.length > 0 ? token : null;
  }

  removeToken(): void {
    this.token = null;
  }
}
