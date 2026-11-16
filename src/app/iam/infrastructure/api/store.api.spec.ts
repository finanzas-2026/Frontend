import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from '@mocks/server';
import { AppError } from '@shared/application/app-error';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { StoreStatuses } from '../../domain/enums/store-status.enum';
import { Store } from '../../domain/model/store.entity';
import { StoreAssembler } from '../assemblers/store.assembler';
import { StoreResource } from '../resources/store.resource';
import { StoreApi } from './store.api';

function storeResource(overrides: Partial<StoreResource> = {}): StoreResource {
  return {
    id: 1,
    business_name: 'Bodega Don Pepe',
    tax_id: '20512345678',
    address: 'Av. Los Olivos 450, Lima',
    created_at: '2026-10-01T08:00:00Z',
    status: StoreStatuses.ACTIVE,
    ...overrides,
  };
}

function storeEntity(overrides: Partial<ConstructorParameters<typeof Store>[0]> = {}): Store {
  return new Store({
    id: 1,
    businessName: 'Bodega Don Pepe',
    taxId: '20512345678',
    address: 'Av. Los Olivos 450, Lima',
    createdAt: new Date('2026-10-01T08:00:00Z'),
    status: StoreStatuses.ACTIVE,
    ...overrides,
  });
}

function setupApi(): StoreApi {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
      StoreAssembler,
      StoreApi,
    ],
  });

  return TestBed.inject(StoreApi);
}

describe('StoreApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('gets all stores from the configured endpoint', async () => {
    server.use(
      http.get('*/api/v1/stores', () => HttpResponse.json([storeResource()]))
    );

    const stores = await firstValueFrom(setupApi().getAll());

    expect(stores).toHaveLength(1);
    expect(stores[0]).toBeInstanceOf(Store);
    expect(stores[0]?.businessName).toBe('Bodega Don Pepe');
  });

  it('gets a store by id', async () => {
    server.use(
      http.get('*/api/v1/stores/1', () => HttpResponse.json(storeResource()))
    );

    const store = await firstValueFrom(setupApi().getById(1));

    expect(store).toBeInstanceOf(Store);
    expect(store.id).toBe(1);
  });

  it('registers a store with a POST request', async () => {
    const bodies: StoreResource[] = [];
    server.use(
      http.post('*/api/v1/stores', async ({ request }) => {
        bodies.push((await request.json()) as StoreResource);
        return HttpResponse.json(storeResource({ id: 10 }), { status: 201 });
      })
    );

    const created = await firstValueFrom(setupApi().create(storeEntity()));

    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.tax_id).toBe('20512345678');
    expect(bodies[0]?.created_at).toBe('2026-10-01T08:00:00.000Z');
    expect(created.id).toBe(10);
  });

  it('updates a store with a PUT request', async () => {
    server.use(
      http.put('*/api/v1/stores/1', async ({ request }) => {
        const body = (await request.json()) as StoreResource;
        return HttpResponse.json(body);
      })
    );

    const updated = await firstValueFrom(
      setupApi().update(storeEntity({ businessName: 'Bodega Renovada' }), 1)
    );

    expect(updated.businessName).toBe('Bodega Renovada');
  });

  it('finds a store by tax id', async () => {
    server.use(
      http.get('*/api/v1/stores', ({ request }) => {
        const taxId = new URL(request.url).searchParams.get('tax_id');
        return HttpResponse.json(
          taxId === '20512345678' ? [storeResource()] : []
        );
      })
    );

    expect((await firstValueFrom(setupApi().findByTaxId('20512345678')))?.id).toBe(1);
    expect(await firstValueFrom(setupApi().findByTaxId('20999999999'))).toBeNull();
  });

  it('maps HTTP errors to AppError', async () => {
    server.use(
      http.get('*/api/v1/stores/999', () =>
        HttpResponse.json(
          { code: 'STORE_NOT_FOUND', message: 'Tienda inexistente' },
          { status: 404 }
        )
      )
    );

    try {
      await firstValueFrom(setupApi().getById(999));
      throw new Error('Se esperaba un error HTTP');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('STORE_NOT_FOUND');
      expect((error as AppError).httpStatus).toBe(404);
    }
  });
});
