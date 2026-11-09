import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { CustomerCreditInfo } from '../../domain/model/customer-credit-info.entity';
import { SALES_REPOSITORY, SalesRepository } from '../../domain/repositories/sales.repository';

@Injectable({
  providedIn: 'root',
})
export class GetCustomersUseCase implements UseCase<void, CustomerCreditInfo[]> {
  private readonly salesRepository = inject<SalesRepository>(SALES_REPOSITORY);

  async execute(): Promise<Result<CustomerCreditInfo[], AppError>> {
    try {
      const customers = await firstValueFrom(this.salesRepository.getCustomers());
      return ok(customers);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(
        new AppError(
          'GET_CUSTOMERS_FAILED',
          error instanceof Error ? error.message : 'Error al obtener los clientes'
        )
      );
    }
  }
}
