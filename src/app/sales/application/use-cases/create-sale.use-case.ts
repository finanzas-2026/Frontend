import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { Sale } from '../../domain/model/sale.entity';
import { SALES_REPOSITORY, SalesRepository } from '../../domain/repositories/sales.repository';
import { CreateSaleCommand } from '../models/create-sale.command';

@Injectable({
  providedIn: 'root',
})
export class CreateSaleUseCase implements UseCase<CreateSaleCommand, Sale> {
  private readonly salesRepository = inject<SalesRepository>(SALES_REPOSITORY);

  async execute(command: CreateSaleCommand): Promise<Result<Sale, AppError>> {
    try {
      const sale = await firstValueFrom(this.salesRepository.createSale(command));
      return ok(sale);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(
        new AppError(
          'CREATE_SALE_FAILED',
          error instanceof Error ? error.message : 'Error al registrar la venta'
        )
      );
    }
  }
}
