import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { Store } from '../../domain/model/store.entity';
import { StoreRepository } from '../../domain/repositories/store.repository';
import { StoreApi } from '../api/store.api';

/**
 * HTTP implementation of the IAM store persistence contract.
 *
 * The domain stays Promise-based and framework-free; RxJS is adapted here.
 */
@Service()
export class HttpStoreRepository implements StoreRepository {
  private readonly api = inject(StoreApi);

  async findById(id: number): Promise<Store | null> {
    try {
      return await firstValueFrom(this.api.getById(id));
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async findByTaxId(taxId: string): Promise<Store | null> {
    return firstValueFrom(this.api.findByTaxId(taxId));
  }

  async findAll(): Promise<Store[]> {
    return firstValueFrom(this.api.getAll());
  }

  async save(store: Store): Promise<Store> {
    return firstValueFrom(this.api.create(store));
  }

  async update(store: Store): Promise<Store> {
    return firstValueFrom(this.api.update(store, store.id));
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof AppError && error.httpStatus === 404;
}
