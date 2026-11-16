import { describe, expect, it } from 'vitest';
import { UserRoles } from '../domain/constants/user-roles.constant';
import { UserStatuses } from '../domain/enums/user-status.enum';
import { User } from '../domain/model/user.entity';
import { toSessionUser } from './auth-session';

function domainUser(): User {
  return new User({
    id: 7,
    storeId: 2,
    username: 'lucia.m',
    passwordHash: '$2b$10$supersecrethashvalue123456',
    firstName: 'Lucía',
    lastName: 'Mendoza',
    email: 'lucia@mail.pe',
    role: UserRoles.STORE_ADMIN,
    status: UserStatuses.ACTIVE,
  });
}

describe('AuthSession', () => {
  it('projects only session-safe user fields from the Domain entity', () => {
    const sessionUser = toSessionUser(domainUser());

    expect(sessionUser).toEqual({
      id: 7,
      storeId: 2,
      username: 'lucia.m',
      firstName: 'Lucía',
      lastName: 'Mendoza',
      email: 'lucia@mail.pe',
      role: UserRoles.STORE_ADMIN,
      status: UserStatuses.ACTIVE,
    });
  });

  it('never carries password material into the session projection', () => {
    const sessionUser = toSessionUser(domainUser());
    const keys = Object.keys(sessionUser);

    expect(keys).not.toContain('passwordHash');
    expect(keys).not.toContain('password');
    expect(JSON.stringify(sessionUser)).not.toContain('supersecret');
  });

  it('preserves a null store for platform-wide users', () => {
    const platformUser = new User({
      id: 1,
      storeId: null,
      username: 'root',
      passwordHash: '$2b$10$anothersupersecrethash123',
      firstName: 'Root',
      lastName: 'Admin',
      email: 'root@mail.pe',
      role: UserRoles.SUPER_ADMIN,
      status: UserStatuses.ACTIVE,
    });

    expect(toSessionUser(platformUser).storeId).toBeNull();
  });
});
