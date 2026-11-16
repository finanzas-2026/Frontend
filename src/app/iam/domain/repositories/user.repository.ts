import { User } from '../model/user.entity';

/**
 * Persistence abstraction for the User aggregate. Implementations live in
 * Infrastructure; the domain only depends on this contract.
 */
export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByStoreId(storeId: number): Promise<User[]>;
  /** Persists a new user and returns the stored representation. */
  save(user: User): Promise<User>;
  /** Updates an existing user and returns the stored representation. */
  update(user: User): Promise<User>;
}
