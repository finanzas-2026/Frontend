import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from '@mocks/server';
import { AppError } from '@shared/application/app-error';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { UserRoles } from '../../domain/constants/user-roles.constant';
import { UserStatuses } from '../../domain/enums/user-status.enum';
import { User } from '../../domain/model/user.entity';
import { UserAssembler } from '../assemblers/user.assembler';
import { UserResource } from '../resources/user.resource';
import { UserApi } from './user.api';

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

function setupApi(): UserApi {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
      UserAssembler,
      UserApi,
    ],
  });

  return TestBed.inject(UserApi);
}

describe('UserApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('gets all users from the configured endpoint', async () => {
    server.use(
      http.get('*/api/v1/users', () => HttpResponse.json([userResource()]))
    );

    const users = await firstValueFrom(setupApi().getAll());

    expect(users).toHaveLength(1);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0]?.username).toBe('ana.g');
  });

  it('adapts a wrapped collection response', async () => {
    server.use(
      http.get('*/api/v1/users', () =>
        HttpResponse.json({ data: [userResource({ id: 4 })] })
      )
    );

    const users = await firstValueFrom(setupApi().getAll());

    expect(users).toHaveLength(1);
    expect(users[0]?.id).toBe(4);
  });

  it('gets a user by id', async () => {
    server.use(
      http.get('*/api/v1/users/3', () => HttpResponse.json(userResource()))
    );

    const user = await firstValueFrom(setupApi().getById(3));

    expect(user).toBeInstanceOf(User);
    expect(user.id).toBe(3);
  });

  it('creates a user with a POST request and snake_case payload', async () => {
    const bodies: UserResource[] = [];
    server.use(
      http.post('*/api/v1/users', async ({ request }) => {
        bodies.push((await request.json()) as UserResource);
        return HttpResponse.json(userResource({ id: 99 }), { status: 201 });
      })
    );

    const created = await firstValueFrom(setupApi().create(userEntity()));

    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.username).toBe('ana.g');
    expect(bodies[0]?.user_type).toBe(UserRoles.CUSTOMER);
    expect(bodies[0]?.password_hash).toBe('$2b$10$abcdefghijklmnopqrstuv');
    expect(created.id).toBe(99);
  });

  it('updates a user with a PUT request', async () => {
    let requestedId: string | undefined;
    server.use(
      http.put('*/api/v1/users/3', async ({ request }) => {
        requestedId = new URL(request.url).pathname.split('/').pop();
        const body = (await request.json()) as UserResource;
        return HttpResponse.json(body);
      })
    );

    const updated = await firstValueFrom(
      setupApi().update(userEntity({ email: 'nueva@mail.pe' }), 3)
    );

    expect(requestedId).toBe('3');
    expect(updated.email).toBe('nueva@mail.pe');
  });

  it('finds a user by username', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const username = new URL(request.url).searchParams.get('username');
        return HttpResponse.json(username === 'ana.g' ? [userResource()] : []);
      })
    );

    expect((await firstValueFrom(setupApi().findByUsername('ana.g')))?.id).toBe(3);
    expect(await firstValueFrom(setupApi().findByUsername('missing'))).toBeNull();
  });

  it('finds a user by email', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const email = new URL(request.url).searchParams.get('email');
        return HttpResponse.json(email === 'ana@mail.pe' ? [userResource()] : []);
      })
    );

    expect((await firstValueFrom(setupApi().findByEmail('ana@mail.pe')))?.id).toBe(3);
  });

  it('finds users by store id', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const storeId = new URL(request.url).searchParams.get('store_id');
        return HttpResponse.json(storeId === '1' ? [userResource()] : []);
      })
    );

    const users = await firstValueFrom(setupApi().findByStoreId(1));

    expect(users).toHaveLength(1);
    expect(users[0]?.storeId).toBe(1);
  });

  it('maps HTTP errors to AppError', async () => {
    server.use(
      http.get('*/api/v1/users/999', () =>
        HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: 'Usuario inexistente' },
          { status: 404 }
        )
      )
    );

    try {
      await firstValueFrom(setupApi().getById(999));
      throw new Error('Se esperaba un error HTTP');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('USER_NOT_FOUND');
      expect((error as AppError).httpStatus).toBe(404);
    }
  });
});
