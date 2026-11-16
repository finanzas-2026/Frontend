import { InjectionToken, Service, computed, inject, signal } from '@angular/core';
import { AppError } from '@shared/application/app-error';
import { Store } from '../domain/model/store.entity';
import { StoreRepository } from '../domain/repositories/store.repository';

/**
 * Application-level DI token for the Domain store contract. Domain stays free
 * of Angular; Infrastructure binds its HTTP implementation to this token.
 */
export const IAM_STORE_REPOSITORY = new InjectionToken<StoreRepository>(
  'IAM_STORE_REPOSITORY'
);

/**
 * Reactive state and coordination for tenant establishments.
 *
 * `TenantStore` manages stores from Application; it does not introduce a new
 * `Tenant` entity or authorization rules.
 */
@Service()
export class TenantStore {
  private readonly repository = inject(IAM_STORE_REPOSITORY);

  private readonly storesState = signal<readonly Store[]>([]);
  private readonly selectedStoreState = signal<Store | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<AppError | null>(null);
  private requestSequence = 0;

  readonly stores = this.storesState.asReadonly();
  readonly selectedStore = this.selectedStoreState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly storeCount = computed(() => this.storesState().length);
  readonly activeStores = computed(() =>
    this.storesState().filter((store) => store.isActive())
  );

  async loadStores(): Promise<Store[]> {
    const request = this.startRequest();
    try {
      const stores = await this.repository.findAll();
      if (this.isCurrentRequest(request)) {
        this.storesState.set(stores);
        this.selectedStoreState.set(null);
      }
      return stores;
    } catch (error) {
      throw this.failRequest(request, error);
    } finally {
      this.finishRequest(request);
    }
  }

  async loadStore(id: number): Promise<Store | null> {
    const request = this.startRequest();
    try {
      const store = await this.repository.findById(id);
      if (this.isCurrentRequest(request)) {
        this.selectedStoreState.set(store);
      }
      return store;
    } catch (error) {
      throw this.failRequest(request, error);
    } finally {
      this.finishRequest(request);
    }
  }

  async createStore(store: Store): Promise<Store> {
    const request = this.startRequest();
    try {
      const created = await this.repository.save(store);
      if (this.isCurrentRequest(request)) {
        this.upsertStore(created);
        this.selectedStoreState.set(created);
      }
      return created;
    } catch (error) {
      throw this.failRequest(request, error);
    } finally {
      this.finishRequest(request);
    }
  }

  async updateStore(store: Store): Promise<Store> {
    const request = this.startRequest();
    try {
      const updated = await this.repository.update(store);
      if (this.isCurrentRequest(request)) {
        this.upsertStore(updated);
        if (this.selectedStoreState()?.id === updated.id) {
          this.selectedStoreState.set(updated);
        }
      }
      return updated;
    } catch (error) {
      throw this.failRequest(request, error);
    } finally {
      this.finishRequest(request);
    }
  }

  clearState(): void {
    this.requestSequence += 1;
    this.storesState.set([]);
    this.selectedStoreState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
  }

  private startRequest(): number {
    this.requestSequence += 1;
    this.loadingState.set(true);
    this.errorState.set(null);
    return this.requestSequence;
  }

  private isCurrentRequest(request: number): boolean {
    return request === this.requestSequence;
  }

  private finishRequest(request: number): void {
    if (this.isCurrentRequest(request)) {
      this.loadingState.set(false);
    }
  }

  private failRequest(request: number, error: unknown): AppError {
    const appError = toAppError(error);
    if (this.isCurrentRequest(request)) {
      this.errorState.set(appError);
    }
    return appError;
  }

  private upsertStore(store: Store): void {
    const stores = this.storesState();
    const index = stores.findIndex((current) => current.id === store.id);

    if (index < 0) {
      this.storesState.set([...stores, store]);
      return;
    }

    const nextStores = [...stores];
    nextStores[index] = store;
    this.storesState.set(nextStores);
  }
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    'IAM_TENANT_OPERATION_FAILED',
    error instanceof Error
      ? error.message
      : 'No se pudo completar la operación de establecimientos.'
  );
}
