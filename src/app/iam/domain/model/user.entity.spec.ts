import { describe, expect, it } from 'vitest';
import { UserRole, UserRoles } from '../constants/user-roles.constant';
import { UserStatus, UserStatuses } from '../enums/user-status.enum';
import { IamDomainError, IamErrorCodes } from '../exceptions/iam-domain-error';
import { User, UserProps } from './user.entity';

function validProps(overrides: Partial<UserProps> = {}): UserProps {
  return {
    id: 3,
    storeId: 1,
    username: 'ana.g',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@mail.pe',
    role: UserRoles.CUSTOMER,
    status: UserStatuses.ACTIVE,
    ...overrides,
  };
}

function expectIamError(action: () => unknown, code: string): void {
  try {
    action();
    throw new Error('Se esperaba un IamDomainError, pero no se lanzó ninguna excepción.');
  } catch (error) {
    expect(error).toBeInstanceOf(IamDomainError);
    expect((error as IamDomainError).code).toBe(code);
  }
}

describe('User entity', () => {
  it('creates a valid user and keeps the store association', () => {
    const user = new User(validProps());

    expect(user.id).toBe(3);
    expect(user.storeId).toBe(1);
    expect(user.username).toBe('ana.g');
    expect(user.passwordHash).toBe('$2b$10$abcdefghijklmnopqrstuv');
    expect(user.email).toBe('ana@mail.pe');
    expect(user.role).toBe(UserRoles.CUSTOMER);
    expect(user.status).toBe(UserStatuses.ACTIVE);
    expect(user.isActive()).toBe(true);
    expect(user.belongsToStore(1)).toBe(true);
    expect(user.fullName()).toBe('Ana Gómez');
  });

  it('accepts every constant role', () => {
    for (const role of Object.values(UserRoles)) {
      const storeId = role === UserRoles.SUPER_ADMIN ? null : 1;
      const user = new User(validProps({ role, storeId }));
      expect(user.role).toBe(role);
    }
  });

  it('rejects an unknown role', () => {
    expectIamError(
      () => new User(validProps({ role: 'OWNER' as unknown as UserRole })),
      IamErrorCodes.INVALID_ROLE
    );
  });

  it('allows store_id = null for a SUPER_ADMIN', () => {
    const user = new User(
      validProps({ role: UserRoles.SUPER_ADMIN, storeId: null })
    );

    expect(user.storeId).toBeNull();
    expect(user.isSuperAdmin()).toBe(true);
    expect(user.isPlatformUser()).toBe(true);
  });

  it('rejects a non-SUPER_ADMIN without a store', () => {
    expectIamError(
      () => new User(validProps({ role: UserRoles.STORE_ADMIN, storeId: null })),
      IamErrorCodes.INVALID_STORE_ASSOCIATION
    );
  });

  it('rejects an invalid store identifier', () => {
    expectIamError(
      () => new User(validProps({ storeId: 0 })),
      IamErrorCodes.INVALID_ID
    );
    expectIamError(
      () => new User(validProps({ storeId: -1 })),
      IamErrorCodes.INVALID_ID
    );
  });

  it('rejects empty mandatory fields', () => {
    const fields: (keyof UserProps)[] = [
      'username',
      'passwordHash',
      'firstName',
      'lastName',
      'email',
    ];

    for (const field of fields) {
      expectIamError(
        () => new User(validProps({ [field]: '   ' })),
        IamErrorCodes.REQUIRED_FIELD
      );
    }
  });

  it('rejects an invalid email format', () => {
    for (const email of ['ana', 'ana@', '@mail.pe', 'ana@mail', 'ana @mail.pe']) {
      expectIamError(
        () => new User(validProps({ email })),
        IamErrorCodes.INVALID_EMAIL
      );
    }
  });

  it('rejects unknown user statuses', () => {
    expectIamError(
      () => new User(validProps({ status: 'BLOCKED' as unknown as UserStatus })),
      IamErrorCodes.INVALID_USER_STATUS
    );
  });

  it('rejects an invalid identifier', () => {
    expectIamError(() => new User(validProps({ id: 0 })), IamErrorCodes.INVALID_ID);
    expectIamError(() => new User(validProps({ id: 1.5 })), IamErrorCodes.INVALID_ID);
  });
});
