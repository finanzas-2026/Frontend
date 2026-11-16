import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@shared/application/app-error';
import { StoreStatuses } from '../domain/enums/store-status.enum';
import { Store } from '../domain/model/store.entity';
import { StoreRepository } from '../domain/repositories/store.repository';
import { IAM_STORE_REPOSITORY, TenantStore } from './tenant.store';

function store(
  overrides: Partial<ConstructorParameters<typeof Store>[0]> = {}
): Store {
  return new Store({
    id: 1,
    businessName: 'Bodega Central',
    taxId: '20123456789',
    address: 'Av. Siempre Viva 742',
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    status: StoreStatuses.ACTIVE,
    ...overrides,
  });
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createRepository(): StoreRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByTaxId: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    update: vi.fn(),
  };
}

describe('TenantStore', () => {
  let repository: StoreRepository;
  let tenantStore: TenantStore;

  beforeEach(() => {
    repository = createRepository();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: IAM_STORE_REPOSITORY, useValue: repository }],
    });
    tenantStore = TestBed.inject(TenantStore);
  });

  it('loads every registered establishment', async () => {
    const central = store();
    const north = store({
      id: 2,
      businessName: 'Bodega Norte',
      taxId: '20987654321',
    });
    vi.mocked(repository.findAll).mockResolvedValue([central, north]);

    const result = await tenantStore.loadStores();

    expect(repository.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([central, north]);
    expect(tenantStore.stores()).toEqual([central, north]);
    expect(tenantStore.storeCount()).toBe(2);
    expect(tenantStore.activeStores()).toEqual([central, north]);
    expect(tenantStore.isLoading()).toBe(false);
  });

  it('loads a single establishment as the selected store', async () => {
    const central = store();
    vi.mocked(repository.findById).mockResolvedValue(central);

    const result = await tenantStore.loadStore(1);

    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(result).toBe(central);
    expect(tenantStore.selectedStore()).toBe(central);
  });

  it('creates a store, adds it to the collection and selects it', async () => {
    const created = store();
    vi.mocked(repository.save).mockResolvedValue(created);

    const result = await tenantStore.createStore(created);

    expect(repository.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
    expect(tenantStore.stores()).toEqual([created]);
    expect(tenantStore.selectedStore()).toBe(created);
  });

  it('updates a store and replaces its previous representation', async () => {
    const central = store();
    const updated = store({ businessName: 'Bodega Central Renovada' });
    vi.mocked(repository.findAll).mockResolvedValue([central]);
    vi.mocked(repository.findById).mockResolvedValue(central);
    vi.mocked(repository.update).mockResolvedValue(updated);
    await tenantStore.loadStores();
    await tenantStore.loadStore(1);

    const result = await tenantStore.updateStore(updated);

    expect(repository.update).toHaveBeenCalledWith(updated);
    expect(result).toBe(updated);
    expect(tenantStore.stores()).toEqual([updated]);
    expect(tenantStore.selectedStore()).toBe(updated);
  });

  it('exposes repository errors as AppError and completes loading', async () => {
    const error = new AppError('STORES_UNAVAILABLE', 'Servicio no disponible', 503);
    vi.mocked(repository.findAll).mockRejectedValue(error);

    await expect(tenantStore.loadStores()).rejects.toBe(error);

    expect(tenantStore.error()).toBe(error);
    expect(tenantStore.isLoading()).toBe(false);
    expect(tenantStore.stores()).toEqual([]);
  });

  it('wraps unknown failures in an AppError', async () => {
    vi.mocked(repository.findById).mockRejectedValue(new Error('boom'));

    await expect(tenantStore.loadStore(1)).rejects.toMatchObject({
      code: 'IAM_TENANT_OPERATION_FAILED',
      message: 'boom',
    });

    expect(tenantStore.error()?.code).toBe('IAM_TENANT_OPERATION_FAILED');
  });

  it('does not let a stale response overwrite the newest collection', async () => {
    const first = deferred<Store[]>();
    const second = deferred<Store[]>();
    const central = store();
    const north = store({
      id: 2,
      businessName: 'Bodega Norte',
      taxId: '20987654321',
    });
    vi.mocked(repository.findAll)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstLoad = tenantStore.loadStores();
    const secondLoad = tenantStore.loadStores();
    second.resolve([north]);
    await secondLoad;
    first.resolve([central]);
    await firstLoad;

    expect(tenantStore.stores()).toEqual([north]);
    expect(tenantStore.isLoading()).toBe(false);
  });

  it('clears stores, selection, loading and error', async () => {
    const central = store();
    vi.mocked(repository.findAll).mockResolvedValue([central]);
    await tenantStore.loadStores();
    vi.mocked(repository.findById).mockRejectedValue(new Error('boom'));
    await tenantStore.loadStore(1).catch(() => undefined);

    tenantStore.clearState();

    expect(tenantStore.stores()).toEqual([]);
    expect(tenantStore.selectedStore()).toBeNull();
    expect(tenantStore.activeStores()).toEqual([]);
    expect(tenantStore.isLoading()).toBe(false);
    expect(tenantStore.error()).toBeNull();
  });
});
