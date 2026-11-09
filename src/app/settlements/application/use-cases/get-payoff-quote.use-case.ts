import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { PayoffQuote } from '../../domain/model/payoff-quote.vo';
import {
  SETTLEMENTS_REPOSITORY,
  SettlementsRepository,
} from '../../domain/repositories/settlements.repository';

export interface GetPayoffQuoteParams {
  settlementId: number;
  targetDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GetPayoffQuoteUseCase implements UseCase<GetPayoffQuoteParams, PayoffQuote> {
  private readonly repository = inject<SettlementsRepository>(SETTLEMENTS_REPOSITORY);

  async execute(params: GetPayoffQuoteParams): Promise<Result<PayoffQuote, AppError>> {
    try {
      const data = await firstValueFrom(
        this.repository.getPayoffQuote(params.settlementId, params.targetDate)
      );
      return ok(data);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'PAYOFF_QUOTE_FAILED',
          error instanceof Error ? error.message : 'Error al cotizar liquidación de cobro'
        )
      );
    }
  }
}
