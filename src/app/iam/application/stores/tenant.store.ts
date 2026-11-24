import { inject, signal, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Store } from '../../domain/model/store.entity';
import { StoreApi } from '../../infrastructure/api/store.api';
import { CreateStoreRequest } from '../../infrastructure/resources/store.resource';

/**
 * Tenant collection and active-tenant state.
 *
 * It does not depend on `AuthStore`: the coordination is one-way, from
 * `AuthStore` to this store, so there is no circular dependency.
 */
@Service()
export class TenantStore {
  private readonly storeApi = inject(StoreApi);

  private readonly tenantsState = signal<Store[]>([]);
  private readonly activeTenantState = signal<Store | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly tenants = this.tenantsState.asReadonly();
  readonly activeTenant = this.activeTenantState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadTenants(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const tenants = await firstValueFrom(this.storeApi.getAll());
      this.tenantsState.set(tenants);
      this.syncActiveTenant(tenants);
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async loadTenantById(id: number): Promise<Store> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const tenant = await firstValueFrom(this.storeApi.getById(id));
      this.tenantsState.update((tenants) => upsert(tenants, tenant));
      return tenant;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async createTenant(request: CreateStoreRequest): Promise<Store> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const created = await firstValueFrom(this.storeApi.create(request));
      this.tenantsState.update((tenants) => [...tenants, created]);
      return created;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async updateTenant(tenant: Store): Promise<Store> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const updated = await firstValueFrom(this.storeApi.update(tenant));
      this.tenantsState.update((tenants) => upsert(tenants, updated));
      this.activeTenantState.update((active) => (active?.id === updated.id ? updated : active));
      return updated;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async deactivateTenant(id: number): Promise<Store> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const deactivated = await firstValueFrom(this.storeApi.deactivate(id));
      this.tenantsState.update((tenants) => upsert(tenants, deactivated));
      this.activeTenantState.update((active) => (active?.id === id ? deactivated : active));
      return deactivated;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  setActiveTenant(tenant: Store | null): void {
    this.activeTenantState.set(tenant);
  }

  clearActiveTenant(): void {
    this.activeTenantState.set(null);
  }

  private syncActiveTenant(tenants: Store[]): void {
    this.activeTenantState.update((active) =>
      active === null ? null : (tenants.find((tenant) => tenant.id === active.id) ?? null),
    );
  }
}

function upsert(tenants: Store[], tenant: Store): Store[] {
  return tenants.some((item) => item.id === tenant.id)
    ? tenants.map((item) => (item.id === tenant.id ? tenant : item))
    : [...tenants, tenant];
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación sobre las tiendas.';
}
