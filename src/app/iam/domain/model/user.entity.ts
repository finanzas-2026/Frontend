import { BaseEntity } from '@shared/domain';
import { UserRole, UserRoles, isUserRole } from '../constants/user-roles.constant';
import { UserStatus, UserStatuses, isUserStatus } from '../enums/user-status.enum';
import { IamDomainError } from '../exceptions/iam-domain-error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserProps {
  readonly id: number;
  /** Null only for platform-wide users (SUPER_ADMIN). */
  readonly storeId: number | null;
  readonly username: string;
  /** Opaque credential material: the domain never receives or hashes plain passwords. */
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
}

/**
 * Identity aggregate root. Protects its invariants at construction time and
 * remains ignorant of persistence, authentication protocols and hashing.
 */
export class User implements BaseEntity {
  readonly id: number;
  readonly storeId: number | null;
  readonly username: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;

  constructor(props: UserProps) {
    assertPositiveInteger(props.id, 'usuario');
    const role = assertRole(props.role);
    assertStoreAssociation(props.storeId, role);

    this.id = props.id;
    this.storeId = props.storeId;
    this.username = requireText(props.username, 'username');
    this.passwordHash = requirePasswordHash(props.passwordHash);
    this.firstName = requireText(props.firstName, 'first_name');
    this.lastName = requireText(props.lastName, 'last_name');
    this.email = requireEmail(props.email);
    this.role = role;
    this.status = assertUserStatus(props.status);
  }

  isActive(): boolean {
    return this.status === UserStatuses.ACTIVE;
  }

  isSuperAdmin(): boolean {
    return this.role === UserRoles.SUPER_ADMIN;
  }

  isPlatformUser(): boolean {
    return this.storeId === null;
  }

  belongsToStore(storeId: number): boolean {
    return this.storeId === storeId;
  }

  fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

function requireText(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw IamDomainError.requiredField(field);
  }
  return value.trim();
}

function requirePasswordHash(value: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw IamDomainError.requiredField('password_hash');
  }
  return value;
}

function requireEmail(value: string): string {
  const email = requireText(value, 'email');
  if (!EMAIL_PATTERN.test(email)) {
    throw IamDomainError.invalidEmail(email);
  }
  return email;
}

function assertPositiveInteger(value: number, entity: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw IamDomainError.invalidId(entity, value);
  }
}

function assertRole(value: string): UserRole {
  if (!isUserRole(value)) {
    throw IamDomainError.invalidRole(value);
  }
  return value;
}

function assertUserStatus(value: string): UserStatus {
  if (!isUserStatus(value)) {
    throw IamDomainError.invalidUserStatus(value);
  }
  return value;
}

function assertStoreAssociation(storeId: number | null, role: UserRole): void {
  if (storeId === null) {
    if (role !== UserRoles.SUPER_ADMIN) {
      throw IamDomainError.invalidStoreAssociation(
        'solo un usuario SUPER_ADMIN puede existir sin tienda.'
      );
    }
    return;
  }

  if (!Number.isInteger(storeId) || storeId <= 0) {
    throw IamDomainError.invalidId('la tienda del usuario', storeId);
  }
}
