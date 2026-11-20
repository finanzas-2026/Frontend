import { Service } from '@angular/core';
import { BaseAssembler } from '@shared';
import { ProductStatus, ProductStatuses } from '../../domain/constants/product-status.constant';
import { UnitOfMeasure, UnitOfMeasures } from '../../domain/enums/unit-of-measure.enum';
import { Product } from '../../domain/model/product.entity';
import { ProductResource } from '../resources/product.resource';

const KNOWN_STATUSES = Object.values(ProductStatuses);
const KNOWN_UNITS = Object.values(UnitOfMeasures);

/**
 * Maps `products` HTTP payloads to the Domain `Product` and back.
 *
 * It only transforms representations: no HTTP, no state and no defaults that
 * could hide inconsistent data. Nullable resource columns are represented as
 * absent optional properties in Domain.
 */
@Service()
export class ProductAssembler implements BaseAssembler<Product, ProductResource, ProductResource[]> {
  toEntityFromResource(resource: ProductResource): Product {
    return {
      id: resource.id,
      storeId: resource.store_id,
      name: resource.name,
      description: resource.description ?? undefined,
      brand: resource.brand ?? undefined,
      supplier: resource.supplier ?? undefined,
      unitOfMeasure: toUnitOfMeasure(resource.unit_of_measure),
      imageUrl: resource.image_url ?? undefined,
      cashPrice: resource.cash_price,
      creditListPrice: resource.credit_list_price,
      allowsMonthlyPayments: resource.allows_monthly_payments,
      currentStock: resource.current_stock,
      minStock: resource.min_stock,
      status: toProductStatus(resource.status),
    };
  }

  toResourceFromEntity(entity: Product): ProductResource {
    return {
      id: entity.id,
      store_id: entity.storeId,
      name: entity.name,
      description: entity.description ?? null,
      brand: entity.brand ?? null,
      supplier: entity.supplier ?? null,
      unit_of_measure: entity.unitOfMeasure,
      image_url: entity.imageUrl ?? null,
      cash_price: entity.cashPrice,
      credit_list_price: entity.creditListPrice,
      allows_monthly_payments: entity.allowsMonthlyPayments,
      current_stock: entity.currentStock,
      min_stock: entity.minStock,
      status: entity.status,
    };
  }

  toEntitiesFromResponse(response: ProductResource[]): Product[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}

function toProductStatus(value: string): ProductStatus {
  if (!KNOWN_STATUSES.includes(value as ProductStatus)) {
    throw new Error(`Estado de producto desconocido: "${value}".`);
  }
  return value as ProductStatus;
}

function toUnitOfMeasure(value: string): UnitOfMeasure {
  if (!KNOWN_UNITS.includes(value as UnitOfMeasure)) {
    throw new Error(`Unidad de medida de producto desconocida: "${value}".`);
  }
  return value as UnitOfMeasure;
}
