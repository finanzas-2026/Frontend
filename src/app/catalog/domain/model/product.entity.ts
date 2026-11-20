import { BaseEntity } from '@shared/domain';
import { ProductStatus } from '../constants/product-status.constant';
import { UnitOfMeasure } from '../enums/unit-of-measure.enum';

/**
 * Catalog product owned by a store.
 *
 * Optional fields mirror the nullable columns of the ER diagram. `storeId` is
 * a primitive reference: Domain does not depend on the IAM `Store` entity.
 *
 * Stock and monetary values are non-negative. Critical stock is derived as
 * `currentStock <= minStock`; it is not persisted as an additional property.
 */
export interface Product extends BaseEntity {
  readonly storeId: number;
  readonly name: string;
  readonly description?: string;
  readonly brand?: string;
  readonly supplier?: string;
  readonly unitOfMeasure: UnitOfMeasure;
  readonly imageUrl?: string;
  readonly cashPrice: number;
  readonly creditListPrice: number;
  readonly allowsMonthlyPayments: boolean;
  readonly currentStock: number;
  readonly minStock: number;
  readonly status: ProductStatus;
}
