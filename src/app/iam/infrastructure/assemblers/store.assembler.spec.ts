import { describe, expect, it } from 'vitest';
import { StoreStatuses } from '../../domain/enums/store-status.enum';
import { IamDomainError, IamErrorCodes } from '../../domain/exceptions/iam-domain-error';
import { Store } from '../../domain/model/store.entity';
import { StoreCollectionResponse, StoreResource } from '../resources/store.resource';
import { StoreAssembler } from './store.assembler';

function storeResource(overrides: Partial<StoreResource> = {}): StoreResource {
  return {
    id: 1,
    business_name: 'Bodega Don Pepe',
    tax_id: '20512345678',
    address: 'Av. Los Olivos 450, Lima',
    created_at: '2026-10-01T08:00:00Z',
    status: StoreStatuses.ACTIVE,
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

describe('StoreAssembler', () => {
  const assembler = new StoreAssembler();

  it('maps a store resource to a domain entity', () => {
    const store = assembler.toEntityFromResource(storeResource());

    expect(store).toBeInstanceOf(Store);
    expect(store.id).toBe(1);
    expect(store.businessName).toBe('Bodega Don Pepe');
    expect(store.taxId).toBe('20512345678');
    expect(store.address).toBe('Av. Los Olivos 450, Lima');
    expect(store.createdAt).toEqual(new Date('2026-10-01T08:00:00Z'));
    expect(store.status).toBe(StoreStatuses.ACTIVE);
  });

  it('maps a domain entity back to its HTTP resource', () => {
    const store = assembler.toEntityFromResource(storeResource());

    expect(assembler.toResourceFromEntity(store)).toEqual({
      ...storeResource(),
      created_at: '2026-10-01T08:00:00.000Z',
    });
  });

  it('maps a bare array response', () => {
    const response: StoreCollectionResponse = [
      storeResource(),
      storeResource({ id: 2, business_name: 'Minimarket El Sol' }),
    ];

    const stores = assembler.toEntitiesFromResponse(response);

    expect(stores).toHaveLength(2);
    expect(stores[0]?.id).toBe(1);
    expect(stores[1]?.businessName).toBe('Minimarket El Sol');
  });

  it('maps a wrapped data response', () => {
    const response: StoreCollectionResponse = { data: [storeResource()] };

    const stores = assembler.toEntitiesFromResponse(response);

    expect(stores).toHaveLength(1);
    expect(stores[0]?.taxId).toBe('20512345678');
  });

  it('returns an empty collection when the response has no data', () => {
    const response: StoreCollectionResponse = { length: 0 };

    expect(assembler.toEntitiesFromResponse(response)).toEqual([]);
  });

  it('rejects an unknown status', () => {
    expectIamError(
      () => assembler.toEntityFromResource(storeResource({ status: 'CLOSED' })),
      IamErrorCodes.INVALID_STORE_STATUS
    );
  });

  it('rejects an invalid tax identifier', () => {
    expectIamError(
      () => assembler.toEntityFromResource(storeResource({ tax_id: '2051234' })),
      IamErrorCodes.INVALID_TAX_ID
    );
  });

  it('rejects an invalid date', () => {
    expectIamError(
      () => assembler.toEntityFromResource(storeResource({ created_at: 'not-a-date' })),
      IamErrorCodes.INVALID_DATE
    );
  });

  it('rejects an invalid identifier', () => {
    expectIamError(
      () => assembler.toEntityFromResource(storeResource({ id: -1 })),
      IamErrorCodes.INVALID_ID
    );
  });

  it('rejects an empty mandatory field', () => {
    expectIamError(
      () => assembler.toEntityFromResource(storeResource({ business_name: '   ' })),
      IamErrorCodes.REQUIRED_FIELD
    );
  });
});
