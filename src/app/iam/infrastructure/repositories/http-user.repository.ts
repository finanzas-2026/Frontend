import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { User } from '../../domain/model/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserApi } from '../api/user.api';

/**
 * HTTP implementation of the IAM user persistence contract.
 *
 * The domain stays Promise-based and framework-free; RxJS is adapted here.
 */
@Service()
export class HttpUserRepository implements UserRepository {
  private readonly api = inject(UserApi);

  async findById(id: number): Promise<User | null> {
    try {
      return await firstValueFrom(this.api.getById(id));
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return firstValueFrom(this.api.findByUsername(username));
  }

  async findByEmail(email: string): Promise<User | null> {
    return firstValueFrom(this.api.findByEmail(email));
  }

  async findByStoreId(storeId: number): Promise<User[]> {
    return firstValueFrom(this.api.findByStoreId(storeId));
  }

  async save(user: User): Promise<User> {
    return firstValueFrom(this.api.create(user));
  }

  async update(user: User): Promise<User> {
    return firstValueFrom(this.api.update(user, user.id));
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof AppError && error.httpStatus === 404;
}
