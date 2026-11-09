import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { CatalogProduct } from '../../domain/model/catalog-product.entity';
import { SALES_REPOSITORY, SalesRepository } from '../../domain/repositories/sales.repository';

@Injectable({
  providedIn: 'root',
})
export class GetCatalogProductsUseCase implements UseCase<void, CatalogProduct[]> {
  private readonly salesRepository = inject<SalesRepository>(SALES_REPOSITORY);

  async execute(): Promise<Result<CatalogProduct[], AppError>> {
    try {
      const products = await firstValueFrom(this.salesRepository.getCatalogProducts());
      return ok(products);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(
        new AppError(
          'GET_PRODUCTS_FAILED',
          error instanceof Error ? error.message : 'Error al obtener productos'
        )
      );
    }
  }
}
