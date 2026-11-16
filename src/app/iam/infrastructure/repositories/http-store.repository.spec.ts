import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from '@mocks/server';
import { AppError } from '@shared/application/app-error';
import { API_BASE_URL } from '@shared/infrastructure/http/api-base-url.token';
import { StoreStatuses } from '../../domain/enums/store-status.enum';
import { Store } from '../../domain/model/store.entity';
import { StoreRepository } from '../../domain/repositories/store.repository';
import { StoreApi } from '../api/store.api';
import { StoreAssembler } from '../assemblers/store.assembler';
import { StoreResource } from '../resources/store.resource';
import { HttpStoreRepository } from './http-store.repository';

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

function setupRepository(): StoreRepository {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
      StoreAssembler,
      StoreApi,
      HttpStoreRepository,
    ],
  });

  return TestBed.inject(HttpStoreRepository);
}

describe('HttpStoreRepository', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('implements the domain contract and returns a Promise', async () => {
    server.use(
      http.get('*/api/v1/stores/1', () => HttpResponse.json(storeResource()))
    );

    const repository = setupRepository();
    const pending = repository.findById(1);

    expect(pending).toBeInstanceOf(Promise);
    const store = await pending;
    expect(store).toBeInstanceOf(Store);
    expect(store?.id).toBe(1);
  });

  it('returns null when the store does not exist', async () => {
    server.use(
      http.get('*/api/v1/stores/999', () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'missing' }, { status: 404 })
      )
    );

    expect(await setupRepository().findById(999)).toBeNull();
  });

  it('lists all stores', async () => {
    server.use(
      http.get('*/api/v1/stores', () => HttpResponse.json([storeResource()]))
    );

    const stores = await setupRepository().findAll();

    expect(stores).toHaveLength(1);
    expect(stores[0]?.businessName).toBe('Bodega Don Pepe');
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

    const repository = setupRepository();
    expect((await repository.findByTaxId('20512345678'))?.id).toBe(1);
    expect(await repository.findByTaxId('20999999999')).toBeNull();
  });

  it('persists a new store through the store API', async () => {
    server.use(
      http.post('*/api/v1/stores', async ({ request }) => {
        const body = (await request.json()) as StoreResource;
        return HttpResponse.json({ ...body, id: 20 }, { status: 201 });
      })
    );

    const created = await setupRepository().save(storeEntity());

    expect(created).toBeInstanceOf(Store);
    expect(created.id).toBe(20);
  });

  it('updates an existing store through the store API', async () => {
    server.use(
      http.put('*/api/v1/stores/1', async ({ request }) => {
        const body = (await request.json()) as StoreResource;
        return HttpResponse.json(body);
      })
    );

    const updated = await setupRepository().update(
      storeEntity({ businessName: 'Bodega Renovada' })
    );

    expect(updated.businessName).toBe('Bodega Renovada');
  });

  it('propagates HTTP errors without translating them in the domain', async () => {
    server.use(
      http.get('*/api/v1/stores/1', () =>
        HttpResponse.json({ code: 'SERVER_ERROR', message: 'boom' }, { status: 500 })
      )
    );

    try {
      await setupRepository().findById(1);
      throw new Error('Se esperaba un error HTTP');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('SERVER_ERROR');
      expect((error as AppError).httpStatus).toBe(500);
    }
  });
});
