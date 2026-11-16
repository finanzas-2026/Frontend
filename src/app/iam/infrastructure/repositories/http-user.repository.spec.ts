import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from '@mocks/server';
import { AppError } from '@shared/application/app-error';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { UserRoles } from '../../domain/constants/user-roles.constant';
import { UserStatuses } from '../../domain/enums/user-status.enum';
import { User } from '../../domain/model/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserApi } from '../api/user.api';
import { UserAssembler } from '../assemblers/user.assembler';
import { UserResource } from '../resources/user.resource';
import { HttpUserRepository } from './http-user.repository';

function userResource(overrides: Partial<UserResource> = {}): UserResource {
  return {
    id: 3,
    store_id: 1,
    username: 'ana.g',
    password_hash: '$2b$10$abcdefghijklmnopqrstuv',
    first_name: 'Ana',
    last_name: 'Gómez',
    email: 'ana@mail.pe',
    user_type: UserRoles.CUSTOMER,
    status: UserStatuses.ACTIVE,
    ...overrides,
  };
}

function userEntity(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: 3,
    storeId: 1,
    username: 'ana.g',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@mail.pe',
    role: UserRoles.CUSTOMER,
    status: UserStatuses.ACTIVE,
    ...overrides,
  });
}

function setupRepository(): UserRepository {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
      UserAssembler,
      UserApi,
      HttpUserRepository,
    ],
  });

  return TestBed.inject(HttpUserRepository);
}

describe('HttpUserRepository', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('implements the domain contract and returns a Promise', async () => {
    server.use(
      http.get('*/api/v1/users/3', () => HttpResponse.json(userResource()))
    );

    const repository = setupRepository();
    const pending = repository.findById(3);

    expect(pending).toBeInstanceOf(Promise);
    const user = await pending;
    expect(user).toBeInstanceOf(User);
    expect(user?.id).toBe(3);
  });

  it('returns null when the user does not exist', async () => {
    server.use(
      http.get('*/api/v1/users/999', () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'missing' }, { status: 404 })
      )
    );

    expect(await setupRepository().findById(999)).toBeNull();
  });

  it('finds a user by username', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const username = new URL(request.url).searchParams.get('username');
        return HttpResponse.json(username === 'ana.g' ? [userResource()] : []);
      })
    );

    const repository = setupRepository();
    expect((await repository.findByUsername('ana.g'))?.id).toBe(3);
    expect(await repository.findByUsername('missing')).toBeNull();
  });

  it('finds a user by email', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const email = new URL(request.url).searchParams.get('email');
        return HttpResponse.json(email === 'ana@mail.pe' ? [userResource()] : []);
      })
    );

    expect((await setupRepository().findByEmail('ana@mail.pe'))?.id).toBe(3);
  });

  it('lists users by store id', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const storeId = new URL(request.url).searchParams.get('store_id');
        return HttpResponse.json(storeId === '1' ? [userResource()] : []);
      })
    );

    const users = await setupRepository().findByStoreId(1);

    expect(users).toHaveLength(1);
    expect(users[0]?.storeId).toBe(1);
  });

  it('persists a new user through the user API', async () => {
    server.use(
      http.post('*/api/v1/users', async ({ request }) => {
        const body = (await request.json()) as UserResource;
        return HttpResponse.json({ ...body, id: 50 }, { status: 201 });
      })
    );

    const created = await setupRepository().save(userEntity());

    expect(created).toBeInstanceOf(User);
    expect(created.id).toBe(50);
  });

  it('updates an existing user through the user API', async () => {
    server.use(
      http.put('*/api/v1/users/3', async ({ request }) => {
        const body = (await request.json()) as UserResource;
        return HttpResponse.json(body);
      })
    );

    const updated = await setupRepository().update(
      userEntity({ lastName: 'Gómez Díaz' })
    );

    expect(updated.lastName).toBe('Gómez Díaz');
  });

  it('propagates HTTP errors without translating them in the domain', async () => {
    server.use(
      http.get('*/api/v1/users/3', () =>
        HttpResponse.json({ code: 'SERVER_ERROR', message: 'boom' }, { status: 500 })
      )
    );

    try {
      await setupRepository().findById(3);
      throw new Error('Se esperaba un error HTTP');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('SERVER_ERROR');
      expect((error as AppError).httpStatus).toBe(500);
    }
  });
});
