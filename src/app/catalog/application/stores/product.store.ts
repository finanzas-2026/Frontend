import { computed, effect, inject, signal, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { AuthStore } from '../../../iam/application/stores/auth.store';
import { ProductStatuses } from '../../domain/constants/product-status.constant';
import { Product } from '../../domain/model/product.entity';
import { ProductApi } from '../../infrastructure/api/product.api';

/**
 * Catalog and inventory application state for the authenticated store.
 *
 * It coordinates `ProductApi` with `AuthStore`, owns no session data and only
 * exposes products whose `storeId` matches the current session. Results from
 * requests started in a previous session are discarded.
 */
@Service()
export class ProductStore {
  private readonly productApi = inject(ProductApi);
  private readonly authStore = inject(AuthStore);

  private readonly productsState = signal<Product[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private lastSessionKey: string | null = null;

  readonly products = computed(() => {
    const storeId = this.authStore.currentStoreId();
    return storeId === null
      ? []
      : this.productsState().filter((product) => product.storeId === storeId);
  });
  readonly activeProducts = computed(() =>
    this.products().filter((product) => product.status === ProductStatuses.ACTIVE),
  );
  readonly lowStockProducts = computed(() =>
    this.products().filter((product) => product.currentStock <= product.minStock),
  );
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor() {
    effect(() => {
      const sessionKey = this.currentSessionKey();
      if (sessionKey === this.lastSessionKey) {
        return;
      }

      this.lastSessionKey = sessionKey;
      this.productsState.set([]);
      this.loadingState.set(false);
      this.errorState.set(null);
    });
  }

  async loadProducts(): Promise<void> {
    const storeId = this.authStore.currentStoreId();
    if (storeId === null) {
      this.productsState.set([]);
      this.loadingState.set(false);
      this.errorState.set(null);
      return;
    }

    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const products = await firstValueFrom(this.productApi.getByStoreId(storeId));
      if (!this.isCurrentContext(sessionKey, storeId)) {
        return;
      }
      this.productsState.set(products.filter((product) => product.storeId === storeId));
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async getProductById(id: number): Promise<Product> {
    assertPositiveId(id, 'producto');
    const storeId = this.requireStoreId();
    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const product = await this.resolveOwnedProduct(id, storeId);
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertProduct(product);
      return product;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async createProduct(product: Product): Promise<Product> {
    assertProductStock(product);
    const storeId = this.requireStoreId();
    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const created = await firstValueFrom(
        this.productApi.create({ ...product, storeId }),
      );
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertProduct(created);
      return created;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async updateProduct(product: Product): Promise<Product> {
    assertProductStock(product);
    const storeId = this.requireStoreId();
    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const existing = await this.resolveOwnedProduct(product.id, storeId);
      this.ensureCurrentContext(sessionKey, storeId);
      const updated = await firstValueFrom(
        this.productApi.update(existing.id, {
          ...product,
          id: existing.id,
          storeId: existing.storeId,
        }),
      );
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertProduct(updated);
      return updated;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async deactivateProduct(id: number): Promise<Product> {
    assertPositiveId(id, 'producto');
    const storeId = this.requireStoreId();
    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const existing = await this.resolveOwnedProduct(id, storeId);
      this.ensureCurrentContext(sessionKey, storeId);
      const deactivated = await firstValueFrom(this.productApi.deactivate(existing.id));
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertProduct(deactivated);
      return deactivated;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  async updateStock(id: number, stock: number): Promise<Product> {
    assertPositiveId(id, 'producto');
    assertStock(stock, 'El stock');
    const storeId = this.requireStoreId();
    const sessionKey = this.currentSessionKey();
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const existing = await this.resolveOwnedProduct(id, storeId);
      this.ensureCurrentContext(sessionKey, storeId);
      const updated = await firstValueFrom(
        this.productApi.updateStock(existing.id, stock),
      );
      this.ensureCurrentContext(sessionKey, storeId);
      this.upsertProduct(updated);
      return updated;
    } catch (error) {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.errorState.set(toErrorMessage(error));
      }
      throw error;
    } finally {
      if (this.isCurrentContext(sessionKey, storeId)) {
        this.loadingState.set(false);
      }
    }
  }

  private requireStoreId(): number {
    const storeId = this.authStore.currentStoreId();
    if (storeId === null) {
      throw new AppError(
        'STORE_REQUIRED',
        'No hay una tienda autenticada para operar el catálogo.',
        403,
      );
    }
    return storeId;
  }

  private async resolveOwnedProduct(id: number, storeId: number): Promise<Product> {
    const cached = this.productsState().find(
      (product) => product.id === id && product.storeId === storeId,
    );
    if (cached) {
      return cached;
    }

    const product = await firstValueFrom(this.productApi.getById(id));
    if (product.storeId !== storeId) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        'El producto no pertenece a la tienda autenticada.',
        404,
      );
    }
    return product;
  }

  private upsertProduct(product: Product): void {
    this.productsState.update((products) =>
      products.some((item) => item.id === product.id)
        ? products.map((item) => (item.id === product.id ? product : item))
        : [...products, product],
    );
  }

  private currentSessionKey(): string | null {
    const session = this.authStore.session();
    return session === null ? null : `${session.userId}:${session.storeId ?? 'none'}`;
  }

  private isCurrentContext(sessionKey: string | null, storeId: number): boolean {
    return (
      this.currentSessionKey() === sessionKey && this.authStore.currentStoreId() === storeId
    );
  }

  private ensureCurrentContext(sessionKey: string | null, storeId: number): void {
    if (!this.isCurrentContext(sessionKey, storeId)) {
      throw new AppError(
        'SESSION_CHANGED',
        'La sesión cambió durante la operación de catálogo.',
        409,
      );
    }
  }
}

function assertPositiveId(id: number, entity: string): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('INVALID_ID', `El identificador de ${entity} no es válido.`, 400);
  }
}

function assertStock(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError('INVALID_STOCK', `${label} debe ser un entero no negativo.`, 400);
  }
}

function assertProductStock(product: Product): void {
  assertPositiveId(product.id, 'producto');
  assertStock(product.currentStock, 'El stock actual');
  assertStock(product.minStock, 'El stock mínimo');
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación de catálogo.';
}
