import { Service } from '@angular/core';
import { BaseAssembler } from '@shared/infrastructure/base-assembler';
import { StoreStatus, isStoreStatus } from '../../domain/enums/store-status.enum';
import { IamDomainError } from '../../domain/exceptions/iam-domain-error';
import { Store } from '../../domain/model/store.entity';
import {
  StoreCollectionResponse,
  StoreResource,
} from '../resources/store.resource';

@Service()
export class StoreAssembler implements BaseAssembler<
  Store,
  StoreResource,
  StoreCollectionResponse
> {
  toEntityFromResource(resource: StoreResource): Store {
    if (!resource) {
      throw IamDomainError.requiredField('store');
    }

    return new Store({
      id: resource.id,
      businessName: resource.business_name,
      taxId: resource.tax_id,
      address: resource.address,
      createdAt: new Date(resource.created_at),
      status: parseStatus(resource.status),
    });
  }

  toResourceFromEntity(entity: Store): StoreResource {
    return {
      id: entity.id,
      business_name: entity.businessName,
      tax_id: entity.taxId,
      address: entity.address,
      created_at: entity.createdAt.toISOString(),
      status: entity.status,
    };
  }

  toEntitiesFromResponse(response: StoreCollectionResponse): Store[] {
    return extractResources(response).map((resource) => this.toEntityFromResource(resource));
  }
}

function extractResources(response: StoreCollectionResponse): StoreResource[] {
  if (response.data) {
    return response.data;
  }

  const resources: StoreResource[] = [];
  for (let index = 0; index < (response.length ?? 0); index += 1) {
    const resource = response[index];
    if (resource) {
      resources.push(resource);
    }
  }
  return resources;
}

function parseStatus(value: string): StoreStatus {
  if (!isStoreStatus(value)) {
    throw IamDomainError.invalidStoreStatus(value);
  }
  return value;
}
