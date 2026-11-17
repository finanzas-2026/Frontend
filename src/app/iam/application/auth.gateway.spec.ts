/// <reference types="node" />
import { TestBed } from '@angular/core/testing';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UserRoles } from '../domain/constants/user-roles.constant';
import { UserStatuses } from '../domain/enums/user-status.enum';
import {
  AUTH_GATEWAY,
  AuthGateway,
  AuthenticationCredentials,
  RegistrationCommand,
} from './auth.gateway';
import { AuthSession, SessionUser } from './auth-session';

const APPLICATION_DIR = join(
  process.cwd(),
  'src',
  'app',
  'iam',
  'application'
);

function collectApplicationSources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return collectApplicationSources(path);
    }
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

const SESSION_USER: SessionUser = {
  id: 3,
  storeId: 1,
  username: 'ana.g',
  firstName: 'Ana',
  lastName: 'Gómez',
  email: 'ana@mail.pe',
  role: UserRoles.STORE_ADMIN,
  status: UserStatuses.ACTIVE,
};

describe('AuthGateway', () => {
  it('supports the sign-in and sign-up contract through a test double', async () => {
    const calls: string[] = [];
    const gateway: AuthGateway = {
      signIn: async (credentials: AuthenticationCredentials) => {
        calls.push(credentials.username);
        return { user: SESSION_USER, token: 'token' };
      },
      signUp: async (command: RegistrationCommand) => {
        calls.push(command.username);
        return SESSION_USER;
      },
    };

    const authentication: AuthSession = await gateway.signIn({
      username: 'ana.g',
      password: 'secret',
    });
    const registered: SessionUser = await gateway.signUp({
      username: 'nuevo.u',
      password: 'secret',
      firstName: 'Nuevo',
      lastName: 'Usuario',
      email: 'nuevo@mail.pe',
      storeId: 1,
    });

    expect(calls).toEqual(['ana.g', 'nuevo.u']);
    expect(authentication.user).toEqual(SESSION_USER);
    expect(registered).toEqual(SESSION_USER);
    expect('signOut' in gateway).toBe(false);
  });

  it('can be resolved through its application-level injection token', () => {
    const gateway: AuthGateway = {
      signIn: async () => ({ user: SESSION_USER }),
      signUp: async () => SESSION_USER,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_GATEWAY, useValue: gateway }],
    });

    expect(TestBed.inject(AUTH_GATEWAY)).toBe(gateway);
  });
});

describe('IAM application layer independence', () => {
  const sources = collectApplicationSources(APPLICATION_DIR);

  it('has application sources to inspect', () => {
    expect(sources.length).toBeGreaterThanOrEqual(5);
  });

  it('does not import IAM Infrastructure, HTTP clients, resources or assemblers', () => {
    for (const source of sources) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).not.toMatch(
        /from ['"][^'"]*iam\/infrastructure|from ['"]\.\.\/infrastructure\//
      );
      expect(content, source).not.toMatch(
        /from ['"]@angular\/common\/http['"]/
      );
      expect(content, source).not.toMatch(
        /from ['"][^'"]*(?:IamApi|UserApi|StoreApi|HttpUserRepository|HttpStoreRepository|UserAssembler|StoreAssembler|resources)['"]/
      );
      expect(content, source).not.toMatch(/from ['"][^'"]*\/resources\//);
    }
  });

  it('does not import Presentation, Router, forms, db.json or browser persistence', () => {
    for (const source of sources) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).not.toMatch(
        /from ['"][^'"]*presentation|@angular\/router|@angular\/forms|db\.json/
      );
      expect(content, source).not.toMatch(
        /localStorage|sessionStorage|document\.cookie/
      );
    }
  });

  it('contains no unsafe TypeScript escapes', () => {
    for (const source of sources) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).not.toMatch(
        /@ts-ignore|@ts-expect-error|\bas any\b|:\s*any\b|<any>/
      );
    }
  });

  it('keeps tokens and credentials out of public authentication state', () => {
    const authStore = readFileSync(
      join(APPLICATION_DIR, 'auth.store.ts'),
      'utf8'
    );

    expect(authStore).not.toMatch(/password/i);
    expect(authStore).not.toMatch(/readonly\s+token\s*=/);
  });

  it('reuses the Domain repository contracts instead of defining new ones', () => {
    const userStore = readFileSync(
      join(APPLICATION_DIR, 'user.store.ts'),
      'utf8'
    );
    const tenantStore = readFileSync(
      join(APPLICATION_DIR, 'tenant.store.ts'),
      'utf8'
    );

    expect(userStore).toMatch(/UserRepository/);
    expect(userStore).toMatch(/IAM_USER_REPOSITORY/);
    expect(tenantStore).toMatch(/StoreRepository/);
    expect(tenantStore).toMatch(/IAM_STORE_REPOSITORY/);
  });
});
