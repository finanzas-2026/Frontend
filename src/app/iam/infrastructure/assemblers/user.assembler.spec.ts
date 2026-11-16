import { describe, expect, it } from 'vitest';
import { UserRoles } from '../../domain/constants/user-roles.constant';
import { UserStatuses } from '../../domain/enums/user-status.enum';
import { IamDomainError, IamErrorCodes } from '../../domain/exceptions/iam-domain-error';
import { User } from '../../domain/model/user.entity';
import { UserCollectionResponse, UserResource } from '../resources/user.resource';
import { UserAssembler } from './user.assembler';

function userResource(overrides: Partial<UserResource> = {}): UserResource {
  return {
    id: 3,
    store_id: 1,
    username: 'ana.g',
    password_hash: '$2b$10$abcdefghijklmnopqrstuv',
    first_name: 'Ana',
    last_name: 'Gómez',
    email: 'ana@mail.pe',
    user_type: UserRoles.CUSTOMER,
    status: UserStatuses.ACTIVE,
    ...overrides,
  };
}

function expectIamError(action: () => unknown, code: string): void {
  expect(action).toThrow(IamDomainError);
  try {
    action();
  } catch (error) {
    expect((error as IamDomainError).code).toBe(code);
  }
}

describe('UserAssembler', () => {
  const assembler = new UserAssembler();

  it('maps a user resource to a domain entity', () => {
    const user = assembler.toEntityFromResource(userResource());

    expect(user).toBeInstanceOf(User);
    expect(user.id).toBe(3);
    expect(user.storeId).toBe(1);
    expect(user.username).toBe('ana.g');
    expect(user.email).toBe('ana@mail.pe');
    expect(user.role).toBe(UserRoles.CUSTOMER);
    expect(user.status).toBe(UserStatuses.ACTIVE);
  });

  it('preserves a null store for a SUPER_ADMIN', () => {
    const user = assembler.toEntityFromResource(
      userResource({ store_id: null, user_type: UserRoles.SUPER_ADMIN })
    );

    expect(user.storeId).toBeNull();
    expect(user.isPlatformUser()).toBe(true);
  });

  it('maps a domain entity back to its HTTP resource', () => {
    const user = assembler.toEntityFromResource(userResource());
    const resource = assembler.toResourceFromEntity(user);

    expect(resource).toEqual(userResource());
  });

  it('maps a bare array response', () => {
    const response: UserCollectionResponse = [userResource(), userResource({ id: 4 })];

    const users = assembler.toEntitiesFromResponse(response);

    expect(users).toHaveLength(2);
    expect(users[0]?.id).toBe(3);
    expect(users[1]?.id).toBe(4);
  });

  it('maps a wrapped data response', () => {
    const response: UserCollectionResponse = { data: [userResource()] };

    const users = assembler.toEntitiesFromResponse(response);

    expect(users).toHaveLength(1);
    expect(users[0]?.username).toBe('ana.g');
  });

  it('returns an empty collection when the response has no data', () => {
    const response: UserCollectionResponse = { length: 0 };

    expect(assembler.toEntitiesFromResponse(response)).toEqual([]);
  });

  it('rejects an unknown role', () => {
    expectIamError(
      () => assembler.toEntityFromResource(userResource({ user_type: 'OWNER' })),
      IamErrorCodes.INVALID_ROLE
    );
  });

  it('rejects an unknown status', () => {
    expectIamError(
      () => assembler.toEntityFromResource(userResource({ status: 'BLOCKED' })),
      IamErrorCodes.INVALID_USER_STATUS
    );
  });

  it('rejects an invalid identifier', () => {
    expectIamError(
      () => assembler.toEntityFromResource(userResource({ id: 0 })),
      IamErrorCodes.INVALID_ID
    );
  });

  it('rejects an invalid email', () => {
    expectIamError(
      () => assembler.toEntityFromResource(userResource({ email: 'ana@mail' })),
      IamErrorCodes.INVALID_EMAIL
    );
  });

  it('rejects a resource without credential material', () => {
    const { password_hash: _passwordHash, ...incomplete } = userResource();

    expectIamError(
      () => assembler.toEntityFromResource(incomplete as UserResource),
      IamErrorCodes.REQUIRED_FIELD
    );
  });
});
