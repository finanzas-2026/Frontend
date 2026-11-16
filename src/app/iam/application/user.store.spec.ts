import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@shared/application/app-error';
import { UserRoles } from '../domain/constants/user-roles.constant';
import { UserStatuses } from '../domain/enums/user-status.enum';
import { User } from '../domain/model/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';
import { IAM_USER_REPOSITORY, UserStore } from './user.store';

function user(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
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

function createRepository(): UserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByUsername: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByStoreId: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    update: vi.fn(),
  };
}

describe('UserStore', () => {
  let repository: UserRepository;
  let store: UserStore;

  beforeEach(() => {
    repository = createRepository();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: IAM_USER_REPOSITORY, useValue: repository }],
    });
    store = TestBed.inject(UserStore);
  });

  it('loads a user by identifier and keeps it as the selected user', async () => {
    const ana = user();
    vi.mocked(repository.findById).mockResolvedValue(ana);

    const result = await store.loadUser(3);

    expect(repository.findById).toHaveBeenCalledWith(3);
    expect(result).toBe(ana);
    expect(store.selectedUser()).toBe(ana);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads users for a single store and resets the previous selection', async () => {
    const ana = user();
    const luis = user({ id: 4, username: 'luis.p', email: 'luis@mail.pe' });
    vi.mocked(repository.findByStoreId).mockResolvedValue([ana, luis]);
    vi.mocked(repository.findById).mockResolvedValue(ana);
    await store.loadUser(3);

    const result = await store.loadUsersByStore(1);

    expect(repository.findByStoreId).toHaveBeenCalledWith(1);
    expect(result).toEqual([ana, luis]);
    expect(store.users()).toEqual([ana, luis]);
    expect(store.selectedUser()).toBeNull();
    expect(store.userCount()).toBe(2);
    expect(store.hasUsers()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('updates both the collection and the selected user', async () => {
    const ana = user();
    const updated = user({ firstName: 'Ana María' });
    vi.mocked(repository.findByStoreId).mockResolvedValue([ana]);
    vi.mocked(repository.findById).mockResolvedValue(ana);
    vi.mocked(repository.update).mockResolvedValue(updated);
    await store.loadUsersByStore(1);
    await store.loadUser(3);

    const result = await store.updateUser(updated);

    expect(repository.update).toHaveBeenCalledWith(updated);
    expect(result).toBe(updated);
    expect(store.users()).toEqual([updated]);
    expect(store.selectedUser()).toBe(updated);
  });

  it('exposes repository errors as AppError and completes loading', async () => {
    const error = new AppError('USERS_UNAVAILABLE', 'Servicio no disponible', 503);
    vi.mocked(repository.findById).mockRejectedValue(error);

    await expect(store.loadUser(3)).rejects.toBe(error);

    expect(store.error()).toBe(error);
    expect(store.selectedUser()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  it('wraps unknown failures in an AppError', async () => {
    vi.mocked(repository.findByStoreId).mockRejectedValue(new Error('boom'));

    await expect(store.loadUsersByStore(1)).rejects.toMatchObject({
      code: 'IAM_USER_OPERATION_FAILED',
      message: 'boom',
    });

    expect(store.error()?.code).toBe('IAM_USER_OPERATION_FAILED');
  });

  it('does not let a stale response overwrite the newest collection', async () => {
    const first = deferred<User[]>();
    const second = deferred<User[]>();
    const ana = user();
    const luis = user({ id: 4, username: 'luis.p', email: 'luis@mail.pe' });
    vi.mocked(repository.findByStoreId)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstLoad = store.loadUsersByStore(1);
    const secondLoad = store.loadUsersByStore(2);
    second.resolve([luis]);
    await secondLoad;
    first.resolve([ana]);
    await firstLoad;

    expect(store.users()).toEqual([luis]);
    expect(store.isLoading()).toBe(false);
  });

  it('clears users, selection, loading and error', async () => {
    const ana = user();
    vi.mocked(repository.findByStoreId).mockResolvedValue([ana]);
    await store.loadUsersByStore(1);
    vi.mocked(repository.findById).mockRejectedValue(new Error('boom'));
    await store.loadUser(3).catch(() => undefined);

    store.clearState();

    expect(store.users()).toEqual([]);
    expect(store.selectedUser()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasUsers()).toBe(false);
  });
});
