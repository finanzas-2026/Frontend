import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpErrorResponse } from '@angular/common/http';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { BaseEntity } from '../domain/model/base-entity';
import { BaseResource, BaseResponse } from './base-response';
import { BaseAssembler } from './base-assembler';
import { BaseApiEndpoint } from './base-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../application/app-error';
import { authInterceptor } from './http/auth.interceptor';
import { errorInterceptor } from './http/error.interceptor';
import { SessionTokenStorage } from './storage/session-token-storage';

interface DummyEntity extends BaseEntity {
  name: string;
}

interface DummyResource extends BaseResource {
  dummy_name: string;
}

interface DummyResponse extends BaseResponse<DummyResource[]> {
  items: DummyResource[];
}

class DummyAssembler implements BaseAssembler<DummyEntity, DummyResource, DummyResponse> {
  toEntityFromResource(resource: DummyResource): DummyEntity {
    return { id: resource.id, name: resource.dummy_name };
  }

  toResourceFromEntity(entity: DummyEntity): DummyResource {
    return { id: entity.id, dummy_name: entity.name };
  }

  toEntitiesFromResponse(response: DummyResponse): DummyEntity[] {
    return (response.items || []).map((r) => this.toEntityFromResource(r));
  }
}

@Injectable()
class DummyEndpointService extends BaseApiEndpoint<DummyEntity, DummyResource, DummyResponse, DummyAssembler> {
  constructor() {
    super(inject(HttpClient), 'http://localhost/api/v1/dummies', new DummyAssembler());
  }
}

describe('BaseApiEndpoint & BaseAssembler Integration with MSW', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  function setupService(token?: string) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        SessionTokenStorage,
        DummyEndpointService,
      ],
    });

    if (token) {
      const storage = TestBed.inject(SessionTokenStorage);
      storage.setToken(token);
    }

    return TestBed.inject(DummyEndpointService);
  }

  it('getAll should map network resources to domain entities via BaseAssembler', async () => {
    server.use(
      http.get('http://localhost/api/v1/dummies', () => {
        return HttpResponse.json({
          items: [
            { id: 1, dummy_name: 'Item 1' },
            { id: 2, dummy_name: 'Item 2' },
          ],
        });
      })
    );

    const service = setupService();
    const entities = await firstValueFrom(service.getAll());

    expect(entities).toHaveLength(2);
    expect(entities[0]).toEqual({ id: 1, name: 'Item 1' });
    expect(entities[1]).toEqual({ id: 2, name: 'Item 2' });
  });

  it('getById and create should perform typed CRUD round-trip', async () => {
    server.use(
      http.get('http://localhost/api/v1/dummies/1', () => {
        return HttpResponse.json({ id: 1, dummy_name: 'Single Item' });
      }),
      http.post('http://localhost/api/v1/dummies', async ({ request }) => {
        const body = (await request.json()) as DummyResource;
        return HttpResponse.json({ id: 99, dummy_name: body.dummy_name }, { status: 201 });
      }),
      http.put('http://localhost/api/v1/dummies/1', async ({ request }) => {
        const body = (await request.json()) as DummyResource;
        return HttpResponse.json({ id: 1, dummy_name: body.dummy_name });
      }),
      http.delete('http://localhost/api/v1/dummies/1', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const service = setupService();
    const item = await firstValueFrom(service.getById(1));
    expect(item).toEqual({ id: 1, name: 'Single Item' });

    const created = await firstValueFrom(service.create({ id: 0, name: 'New Item' }));
    expect(created).toEqual({ id: 99, name: 'New Item' });

    const updated = await firstValueFrom(service.update({ id: 1, name: 'Updated Item' }, 1));
    expect(updated).toEqual({ id: 1, name: 'Updated Item' });

    await firstValueFrom(service.delete(1));
  });

  it('should attach Authorization Bearer token when present in storage', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get('http://localhost/api/v1/dummies', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ items: [] });
      })
    );

    const service = setupService('test-jwt-token-xyz');
    await firstValueFrom(service.getAll());

    expect(capturedAuth).toBe('Bearer test-jwt-token-xyz');

    const storage = TestBed.inject(SessionTokenStorage);
    storage.removeToken();
    expect(storage.getToken()).toBeNull();
  });

  it('should map HTTP errors to AppError via ErrorHandlingEnabledBaseType', async () => {
    server.use(
      http.get('http://localhost/api/v1/dummies/999', () => {
        return HttpResponse.json({ code: 'NOT_FOUND', message: 'Entity missing' }, { status: 404 });
      })
    );

    const service = setupService();
    try {
      await firstValueFrom(service.getById(999));
      expect.fail('Should have failed');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.httpStatus).toBe(404);
      expect(appErr.code).toBe('NOT_FOUND');
    }
  });

  it('handleError should correctly format HttpErrorResponse and ErrorEvent', async () => {
    class TestErrorHandling extends BaseApiEndpoint<DummyEntity, DummyResource, DummyResponse, DummyAssembler> {
      constructor() {
        super(inject(HttpClient), 'http://localhost/api/v1/dummies', new DummyAssembler());
      }

      triggerError(err: unknown) {
        return this.handleError(err);
      }
    }

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), TestErrorHandling],
    });

    const handler = TestBed.inject(TestErrorHandling);

    // 1. Client error event
    const clientErr = new HttpErrorResponse({
      error: new ErrorEvent('NetworkError', { message: 'Failed to connect' }),
      status: 0,
    });
    try {
      await firstValueFrom(handler.triggerError(clientErr));
    } catch (e) {
      expect((e as AppError).code).toBe('CLIENT_NETWORK_ERROR');
    }

    // 2. Generic HttpErrorResponse
    const serverErr = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Error',
      error: 'Raw error',
    });
    try {
      await firstValueFrom(handler.triggerError(serverErr));
    } catch (e) {
      expect((e as AppError).code).toBe('HTTP_500');
    }

    // 3. Native Error
    try {
      await firstValueFrom(handler.triggerError(new Error('Simple failure')));
    } catch (e) {
      expect((e as AppError).message).toBe('Simple failure');
    }
  });
});
