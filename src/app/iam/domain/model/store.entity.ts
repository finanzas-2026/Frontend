import { BaseEntity } from '@shared/domain';
import { StoreStatus, StoreStatuses, isStoreStatus } from '../enums/store-status.enum';
import { IamDomainError } from '../exceptions/iam-domain-error';

const TAX_ID_PATTERN = /^\d{11}$/;

export interface StoreProps {
  readonly id: number;
  readonly businessName: string;
  readonly taxId: string;
  readonly address: string;
  readonly createdAt: Date;
  readonly status: StoreStatus;
}

/**
 * Tenant aggregate root. Holds its identity for the whole lifecycle and does
 * not query or persist other entities.
 */
export class Store implements BaseEntity {
  readonly id: number;
  readonly businessName: string;
  readonly taxId: string;
  readonly address: string;
  readonly createdAt: Date;
  readonly status: StoreStatus;

  constructor(props: StoreProps) {
    assertPositiveInteger(props.id, 'tienda');

    this.id = props.id;
    this.businessName = requireText(props.businessName, 'business_name');
    this.taxId = requireTaxId(props.taxId);
    this.address = requireText(props.address, 'address');
    this.createdAt = requireValidDate(props.createdAt, 'created_at');
    this.status = assertStoreStatus(props.status);
  }

  isActive(): boolean {
    return this.status === StoreStatuses.ACTIVE;
  }
}

function requireText(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw IamDomainError.requiredField(field);
  }
  return value.trim();
}

function requireTaxId(value: string): string {
  const taxId = requireText(value, 'tax_id');
  if (!TAX_ID_PATTERN.test(taxId)) {
    throw IamDomainError.invalidTaxId(taxId);
  }
  return taxId;
}

function requireValidDate(value: Date, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw IamDomainError.invalidDate(field);
  }
  return value;
}

function assertPositiveInteger(value: number, entity: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw IamDomainError.invalidId(entity, value);
  }
}

function assertStoreStatus(value: string): StoreStatus {
  if (!isStoreStatus(value)) {
    throw IamDomainError.invalidStoreStatus(value);
  }
  return value;
}
