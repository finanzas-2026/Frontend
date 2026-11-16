import { Store } from '../model/store.entity';

/**
 * Persistence abstraction for the Store aggregate. Implementations live in
 * Infrastructure; the domain only depends on this contract.
 */
export interface StoreRepository {
  findById(id: number): Promise<Store | null>;
  findByTaxId(taxId: string): Promise<Store | null>;
  findAll(): Promise<Store[]>;
  /** Persists a new store and returns the stored representation. */
  save(store: Store): Promise<Store>;
  /** Updates an existing store and returns the stored representation. */
  update(store: Store): Promise<Store>;
}
