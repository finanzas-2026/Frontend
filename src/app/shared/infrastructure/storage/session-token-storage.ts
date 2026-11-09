import { Injectable } from '@angular/core';
import { TokenStoragePort } from './token-storage.port';

@Injectable({
  providedIn: 'root',
})
export class SessionTokenStorage implements TokenStoragePort {
  private readonly TOKEN_KEY = 'auth_token';

  getToken(): string | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    return window.sessionStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(this.TOKEN_KEY);
    }
  }
}
