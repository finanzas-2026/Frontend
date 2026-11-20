import { inject, signal, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../../domain/model/user.entity';
import { UserApi } from '../../infrastructure/api/user.api';

/**
 * User collection state and CRUD orchestration.
 *
 * It never handles the session, persistence or navigation, and it does not
 * persist users (their `passwordHash` must not reach browser storage).
 */
@Service()
export class UserStore {
  private readonly userApi = inject(UserApi);

  private readonly usersState = signal<User[]>([]);
  private readonly selectedUserState = signal<User | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly users = this.usersState.asReadonly();
  readonly selectedUser = this.selectedUserState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadUsers(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      this.usersState.set(await firstValueFrom(this.userApi.getAll()));
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async loadUserById(id: number): Promise<User> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const user = await firstValueFrom(this.userApi.getById(id));
      this.selectedUserState.set(user);
      this.usersState.update((users) => upsert(users, user));
      return user;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async createUser(user: User): Promise<User> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const created = await firstValueFrom(this.userApi.create(user));
      this.usersState.update((users) => [...users, created]);
      return created;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async updateUser(user: User): Promise<User> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const updated = await firstValueFrom(this.userApi.update(user));
      this.usersState.update((users) => upsert(users, updated));
      this.selectedUserState.update((selected) =>
        selected?.id === updated.id ? updated : selected,
      );
      return updated;
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  async deleteUser(id: number): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      await firstValueFrom(this.userApi.delete(id));
      this.usersState.update((users) => users.filter((user) => user.id !== id));
      this.selectedUserState.update((selected) => (selected?.id === id ? null : selected));
    } catch (error) {
      this.errorState.set(toErrorMessage(error));
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }
}

function upsert(users: User[], user: User): User[] {
  return users.some((item) => item.id === user.id)
    ? users.map((item) => (item.id === user.id ? user : item))
    : [...users, user];
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación sobre los usuarios.';
}
