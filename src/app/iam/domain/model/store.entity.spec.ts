import { describe, expect, it } from 'vitest';
import { StoreStatus, StoreStatuses } from '../enums/store-status.enum';
import { IamDomainError, IamErrorCodes } from '../exceptions/iam-domain-error';
import { Store, StoreProps } from './store.entity';

function validProps(overrides: Partial<StoreProps> = {}): StoreProps {
  return {
    id: 1,
    businessName: 'Bodega Don Pepe',
    taxId: '20512345678',
    address: 'Av. Los Olivos 450, Lima',
    createdAt: new Date('2026-10-01T08:00:00Z'),
    status: StoreStatuses.ACTIVE,
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

describe('Store entity', () => {
  it('creates a valid store and preserves its identity', () => {
    const store = new Store(validProps());

    expect(store.id).toBe(1);
    expect(store.businessName).toBe('Bodega Don Pepe');
    expect(store.taxId).toBe('20512345678');
    expect(store.address).toBe('Av. Los Olivos 450, Lima');
    expect(store.createdAt).toEqual(new Date('2026-10-01T08:00:00Z'));
    expect(store.status).toBe(StoreStatuses.ACTIVE);
    expect(store.isActive()).toBe(true);
  });

  it('accepts every allowed store status', () => {
    for (const status of Object.values(StoreStatuses)) {
      const store = new Store(validProps({ status }));
      expect(store.status).toBe(status);
    }
  });

  it('rejects an unknown store status', () => {
    expectIamError(
      () => new Store(validProps({ status: 'CLOSED' as unknown as StoreStatus })),
      IamErrorCodes.INVALID_STORE_STATUS
    );
  });

  it('accepts an 11-digit RUC', () => {
    const store = new Store(validProps({ taxId: '20698765432' }));
    expect(store.taxId).toBe('20698765432');
  });

  it('rejects a RUC that is not exactly 11 digits', () => {
    for (const taxId of ['2051234567', '205123456789', '2051234567A', '20-512345678']) {
      expectIamError(
        () => new Store(validProps({ taxId })),
        IamErrorCodes.INVALID_TAX_ID
      );
    }
  });

  it('rejects empty mandatory fields', () => {
    for (const field of ['businessName', 'taxId', 'address'] as const) {
      expectIamError(
        () => new Store(validProps({ [field]: '   ' })),
        IamErrorCodes.REQUIRED_FIELD
      );
    }
  });

  it('rejects an invalid creation date', () => {
    expectIamError(
      () => new Store(validProps({ createdAt: new Date('not-a-date') })),
      IamErrorCodes.INVALID_DATE
    );
  });

  it('rejects an invalid identifier', () => {
    expectIamError(() => new Store(validProps({ id: 0 })), IamErrorCodes.INVALID_ID);
    expectIamError(() => new Store(validProps({ id: 2.5 })), IamErrorCodes.INVALID_ID);
  });
});
