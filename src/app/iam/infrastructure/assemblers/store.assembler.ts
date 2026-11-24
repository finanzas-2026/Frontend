import { Service } from '@angular/core';
import { BaseAssembler } from '@shared';
import { StoreStatus, StoreStatuses } from '../../domain/enums/store-status.enum';
import { Store } from '../../domain/model/store.entity';
import { StoreResource } from '../resources/store.resource';

const KNOWN_STATUSES = Object.values(StoreStatuses);

/**
 * Maps `stores` HTTP payloads to the Domain `Store` and back.
 *
 * It only transforms representations: no HTTP, no state and no defaults that
 * could hide inconsistent data.
 */
@Service()
export class StoreAssembler implements BaseAssembler<Store, StoreResource, StoreResource[]> {
  toEntityFromResource(resource: StoreResource): Store {
    return {
      id: resource.id,
      businessName: resource.business_name,
      taxId: resource.tax_id,
      address: resource.address,
      phoneNumber: resource.phone_number ?? undefined,
      createdAt: resource.created_at,
      status: toStoreStatus(resource.status),
    };
  }

  toResourceFromEntity(entity: Store): StoreResource {
    return {
      id: entity.id,
      business_name: entity.businessName,
      tax_id: entity.taxId,
      address: entity.address,
      phone_number: entity.phoneNumber,
      created_at: entity.createdAt,
      status: entity.status,
    };
  }

  toEntitiesFromResponse(response: StoreResource[]): Store[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}

function toStoreStatus(value: string): StoreStatus {
  if (!KNOWN_STATUSES.includes(value as StoreStatus)) {
    throw new Error(`Estado de tienda desconocido: "${value}".`);
  }
  return value as StoreStatus;
}
