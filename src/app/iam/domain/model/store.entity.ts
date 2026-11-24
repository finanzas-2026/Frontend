import { BaseEntity } from '@shared/domain';
import { StoreStatus } from '../enums/store-status.enum';

/**
 * Tenant (commercial store).
 *
 * `createdAt` uses the project convention for dates in Domain: an ISO 8601 string.
 */
export interface Store extends BaseEntity {
  readonly businessName: string;
  readonly taxId: string;
  readonly address: string;
  readonly phoneNumber?: string;
  readonly createdAt: string;
  readonly status: StoreStatus;
}
