import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { Sale } from '../../domain/model/sale.entity';
import { SALES_REPOSITORY, SalesRepository } from '../../domain/repositories/sales.repository';

@Injectable({
  providedIn: 'root',
})
export class ListSalesUseCase implements UseCase<void, Sale[]> {
  private readonly salesRepository = inject<SalesRepository>(SALES_REPOSITORY);

  async execute(): Promise<Result<Sale[], AppError>> {
    try {
      const sales = await firstValueFrom(this.salesRepository.listSales());
      return ok(sales);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(
        new AppError(
          'LIST_SALES_FAILED',
          error instanceof Error ? error.message : 'Error al listar las ventas'
        )
      );
    }
  }
}
