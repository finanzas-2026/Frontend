import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { Sale } from '../../domain/model/sale.entity';
import { SALES_REPOSITORY, SalesRepository } from '../../domain/repositories/sales.repository';

@Injectable({
  providedIn: 'root',
})
export class GetSaleByIdUseCase implements UseCase<number, Sale> {
  private readonly salesRepository = inject<SalesRepository>(SALES_REPOSITORY);

  async execute(id: number): Promise<Result<Sale, AppError>> {
    try {
      const sale = await firstValueFrom(this.salesRepository.getSaleById(id));
      return ok(sale);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(
        new AppError(
          'GET_SALE_FAILED',
          error instanceof Error ? error.message : `Error al obtener la venta #${id}`
        )
      );
    }
  }
}
