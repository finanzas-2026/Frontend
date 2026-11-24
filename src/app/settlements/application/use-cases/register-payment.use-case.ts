import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError, Result, UseCase, err, ok } from '@shared/index';
import { Payment } from '../../domain/model/payment.entity';
import {
  SETTLEMENTS_REPOSITORY,
  SettlementsRepository,
} from '../../domain/repositories/settlements.repository';
import { RegisterPaymentCommand } from '../models/register-payment.command';

@Injectable({
  providedIn: 'root',
})
export class RegisterPaymentUseCase implements UseCase<RegisterPaymentCommand, Payment> {
  private readonly repository = inject<SettlementsRepository>(SETTLEMENTS_REPOSITORY);

  async execute(command: RegisterPaymentCommand): Promise<Result<Payment, AppError>> {
    try {
      const payment = await firstValueFrom(
        this.repository.registerPayment({
          settlementId: command.settlementId,
          amount: command.amount,
          paymentMethod: command.paymentMethod,
          idempotencyKey: command.idempotencyKey,
          referenceNumber: command.referenceNumber,
        })
      );
      return ok(payment);
    } catch (error: unknown) {
      if (error instanceof AppError) return err(error);
      return err(
        new AppError(
          'REGISTER_PAYMENT_FAILED',
          error instanceof Error ? error.message : 'Error al registrar el pago'
        )
      );
    }
  }
}
