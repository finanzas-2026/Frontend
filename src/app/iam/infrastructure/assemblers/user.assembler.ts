import { Service } from '@angular/core';
import { BaseAssembler } from '@shared/infrastructure/base-assembler';
import { UserRole, isUserRole } from '../../domain/constants/user-roles.constant';
import { UserStatus, isUserStatus } from '../../domain/enums/user-status.enum';
import { IamDomainError } from '../../domain/exceptions/iam-domain-error';
import { User } from '../../domain/model/user.entity';
import {
  UserCollectionResponse,
  UserResource,
} from '../resources/user.resource';

@Service()
export class UserAssembler implements BaseAssembler<User, UserResource, UserCollectionResponse> {
  toEntityFromResource(resource: UserResource): User {
    if (!resource) {
      throw IamDomainError.requiredField('user');
    }

    return new User({
      id: resource.id,
      storeId: resource.store_id,
      username: resource.username,
      passwordHash: resource.password_hash,
      firstName: resource.first_name,
      lastName: resource.last_name,
      email: resource.email,
      role: parseRole(resource.user_type),
      status: parseStatus(resource.status),
    });
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
      user_type: entity.role,
      status: entity.status,
    };
  }

  toEntitiesFromResponse(response: UserCollectionResponse): User[] {
    return extractResources(response).map((resource) => this.toEntityFromResource(resource));
  }
}

function extractResources(response: UserCollectionResponse): UserResource[] {
  if (response.data) {
    return response.data;
  }

  const resources: UserResource[] = [];
  for (let index = 0; index < (response.length ?? 0); index += 1) {
    const resource = response[index];
    if (resource) {
      resources.push(resource);
    }
  }
  return resources;
}

function parseRole(value: string): UserRole {
  if (!isUserRole(value)) {
    throw IamDomainError.invalidRole(value);
  }
  return value;
}

function parseStatus(value: string): UserStatus {
  if (!isUserStatus(value)) {
    throw IamDomainError.invalidUserStatus(value);
  }
  return value;
}
