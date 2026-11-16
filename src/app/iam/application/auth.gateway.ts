import { InjectionToken } from '@angular/core';
import { AuthSession, SessionUser } from './auth-session';

/** Credentials consumed by the authentication port. Never persisted. */
export interface AuthenticationCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * Registration data for a tenant-scoped account.
 *
 * No role is accepted: the backend must assign it so a public registration
 * cannot self-assign `SUPER_ADMIN`.
 */
export interface RegistrationCommand {
  readonly username: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly storeId: number;
}

/**
 * Outbound port for authentication operations.
 *
 * It is independent from HttpClient and from IAM HTTP resources. Infrastructure
 * must provide the adapter; no compatible implementation exists yet.
 */
export interface AuthGateway {
  signIn(credentials: AuthenticationCredentials): Promise<AuthSession>;
  signUp(command: RegistrationCommand): Promise<SessionUser>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('IAM_AUTH_GATEWAY');
