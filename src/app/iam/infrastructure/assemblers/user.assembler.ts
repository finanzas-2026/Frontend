import { Injectable } from '@angular/core';
import { BaseAssembler } from '@shared';
import { UserRole, UserRoles } from '../../domain/constants/user-roles.constant';
import { UserStatus, UserStatuses } from '../../domain/enums/user-status.enum';
import { User } from '../../domain/model/user.entity';
import { UserResource } from '../resources/user.resource';

const KNOWN_ROLES = Object.values(UserRoles);
const KNOWN_STATUSES = Object.values(UserStatuses);

/**
 * Maps `users` HTTP payloads to the Domain `User` and back.
 *
 * It only transforms representations: no HTTP, no state and no defaults that
 * could hide inconsistent data.
 */
@Injectable({ providedIn: 'root' })
export class UserAssembler
  implements BaseAssembler<User, UserResource, UserResource[]>
{
  toEntityFromResource(resource: UserResource): User {
    return {
      id: resource.id,
      storeId: resource.store_id,
      username: resource.username,
      passwordHash: resource.password_hash,
      firstName: resource.first_name,
      lastName: resource.last_name,
      email: resource.email,
      userType: toUserRole(resource.user_type),
      status: toUserStatus(resource.status),
    };
  }

  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      store_id: entity.storeId,
      username: entity.username,
      password_hash: entity.passwordHash,
      first_name: entity.firstName,
      last_name: entity.lastName,
      email: entity.email,
      user_type: entity.userType,
      status: entity.status,
    };
  }

  toEntitiesFromResponse(response: UserResource[]): User[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}

function toUserRole(value: string): UserRole {
  if (!KNOWN_ROLES.includes(value as UserRole)) {
    throw new Error(`Rol de usuario desconocido: "${value}".`);
  }
  return value as UserRole;
}

function toUserStatus(value: string): UserStatus {
  if (!KNOWN_STATUSES.includes(value as UserStatus)) {
    throw new Error(`Estado de usuario desconocido: "${value}".`);
  }
  return value as UserStatus;
}
