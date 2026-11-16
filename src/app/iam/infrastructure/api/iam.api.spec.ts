import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from '@mocks/server';
import { AppError } from '@shared/application/app-error';
import { BaseApiEndpoint } from '@shared/infrastructure/base-api-endpoint';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { SignInRequest } from '../resources/sign-in.request';
import { SignUpRequest } from '../resources/sign-up.request';
import { SignUpResponse } from '../resources/sign-up.response';
import { IamApi } from './iam.api';

const signInRequest: SignInRequest = {
  username: 'ana.g',
  password: 'secret',
};

const signUpRequest: SignUpRequest = {
  username: 'nuevo.user',
  password: 'secret',
  first_name: 'Nuevo',
  last_name: 'Usuario',
  email: 'nuevo@mail.pe',
  store_id: 1,
};

const signUpResponse: SignUpResponse = {
  id: 7,
  store_id: 1,
  username: 'nuevo.user',
  first_name: 'Nuevo',
  last_name: 'Usuario',
  email: 'nuevo@mail.pe',
  user_type: 'CUSTOMER',
  status: 'ACTIVE',
};

function setupApi(): IamApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
      IamApi,
    ],
  });

  return TestBed.inject(IamApi);
}

describe('IamApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('does not inherit CRUD operations from BaseApiEndpoint', () => {
    expect(setupApi()).not.toBeInstanceOf(BaseApiEndpoint);
  });

  it('sends a POST request to the configured sign-in endpoint', async () => {
    const bodies: SignInRequest[] = [];
    server.use(
      http.post('*/api/v1/auth/login', async ({ request }) => {
        bodies.push((await request.json()) as SignInRequest);
        return HttpResponse.json({ token: 'jwt-session-token' });
      })
    );

    const response = await firstValueFrom(setupApi().signIn(signInRequest));

    expect(bodies).toEqual([signInRequest]);
    expect(response.token).toBe('jwt-session-token');
  });

  it('sends a POST request to the configured sign-up endpoint', async () => {
    const bodies: SignUpRequest[] = [];
    server.use(
      http.post('*/api/v1/auth/register', async ({ request }) => {
        bodies.push((await request.json()) as SignUpRequest);
        return HttpResponse.json(signUpResponse, { status: 201 });
      })
    );

    const response = await firstValueFrom(setupApi().signUp(signUpRequest));

    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.store_id).toBe(1);
    expect(bodies[0]).not.toHaveProperty('user_type');
    expect(response.id).toBe(7);
  });

  it('maps sign-in HTTP errors to AppError', async () => {
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' },
          { status: 401 }
        )
      )
    );

    try {
      await firstValueFrom(setupApi().signIn(signInRequest));
      throw new Error('Se esperaba un error HTTP');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('INVALID_CREDENTIALS');
      expect((error as AppError).httpStatus).toBe(401);
    }
  });

  it('maps sign-up HTTP errors to AppError', async () => {
    server.use(
      http.post('*/api/v1/auth/register', () =>
        HttpResponse.json(
          { code: 'USERNAME_TAKEN', message: 'Usuario ya registrado' },
          { status: 409 }
        )
      )
    );

    try {
      await firstValueFrom(setupApi().signUp(signUpRequest));
      throw new Error('Se esperaba un error HTTP');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('USERNAME_TAKEN');
      expect((error as AppError).httpStatus).toBe(409);
    }
  });
});
