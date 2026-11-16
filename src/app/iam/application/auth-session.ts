import { User } from '../domain/model/user.entity';

/**
 * Session-safe projection of the Domain `User`.
 *
 * It reuses the property types declared by `User` without copying the entity
 * definition and deliberately excludes `passwordHash`.
 */
export type SessionUser = Pick<
  User,
  | 'id'
  | 'storeId'
  | 'username'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'role'
  | 'status'
>;

/**
 * Application-level representation of an active session.
 *
 * It is not a Domain entity, an HTTP resource or a persistence model. The
 * token is optional because no authentication backend exists yet and the
 * Application must not assume that the service issues one.
 */
export interface AuthSession {
  readonly user: SessionUser;
  readonly token?: string;
}

/**
 * Builds the session-safe projection from a Domain user. No credential
 * material is carried over.
 */
export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    storeId: user.storeId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
