import { InjectionToken, Service, computed, inject, signal } from '@angular/core';
import { AppError } from '@shared/application/app-error';
import { User } from '../domain/model/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';

/**
 * Application-level DI token for the Domain user contract. Domain stays free
 * of Angular; Infrastructure binds its HTTP implementation to this token.
 */
export const IAM_USER_REPOSITORY = new InjectionToken<UserRepository>(
  'IAM_USER_REPOSITORY'
);

/**
 * Reactive state and coordination for user queries and updates.
 *
 * Tenant isolation is preserved: user collections are always loaded by store
 * identifier and platform users are never assumed to belong to a store.
 */
@Service()
export class UserStore {
  private readonly repository = inject(IAM_USER_REPOSITORY);

  private readonly usersState = signal<readonly User[]>([]);
  private readonly selectedUserState = signal<User | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<AppError | null>(null);
  private requestSequence = 0;

  readonly users = this.usersState.asReadonly();
  readonly selectedUser = this.selectedUserState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly userCount = computed(() => this.usersState().length);
  readonly hasUsers = computed(() => this.usersState().length > 0);

  async loadUser(id: number): Promise<User | null> {
    const request = this.startRequest();
    try {
      const user = await this.repository.findById(id);
      if (this.isCurrentRequest(request)) {
        this.selectedUserState.set(user);
      }
      return user;
    } catch (error) {
      throw this.failRequest(request, error);
    } finally {
      this.finishRequest(request);
    }
  }

  async loadUsersByStore(storeId: number): Promise<User[]> {
    const request = this.startRequest();
    try {
      const users = await this.repository.findByStoreId(storeId);
      if (this.isCurrentRequest(request)) {
        this.usersState.set(users);
        this.selectedUserState.set(null);
      }
      return users;
    } catch (error) {
      throw this.failRequest(request, error);
    } finally {
      this.finishRequest(request);
    }
  }

  async updateUser(user: User): Promise<User> {
    const request = this.startRequest();
    try {
      const updated = await this.repository.update(user);
      if (this.isCurrentRequest(request)) {
        this.replaceUser(updated);
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
    this.usersState.set([]);
    this.selectedUserState.set(null);
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

  private replaceUser(updated: User): void {
    const users = this.usersState();
    const index = users.findIndex((user) => user.id === updated.id);

    if (index >= 0) {
      const nextUsers = [...users];
      nextUsers[index] = updated;
      this.usersState.set(nextUsers);
    }

    if (this.selectedUserState()?.id === updated.id) {
      this.selectedUserState.set(updated);
    }
  }
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    'IAM_USER_OPERATION_FAILED',
    error instanceof Error
      ? error.message
      : 'No se pudo completar la operación de usuarios.'
  );
}
