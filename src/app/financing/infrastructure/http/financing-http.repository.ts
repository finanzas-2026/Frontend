import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApi, API_BASE_URL, AppError } from '@shared/index';
import { FinancingRepository } from '../../domain/repositories/financing.repository';
import { AmortizationSchedule } from '../../domain/model/amortization-schedule.entity';
import { SimulateScheduleCommand } from '../../application/models/simulate-schedule.command';
import { FinancingAssembler } from '../mappers/financing.assembler';
import { SimulateScheduleRequestDto } from '../dto/simulate-schedule-request.dto';
import { SimulateScheduleResponseDto } from '../dto/simulate-schedule-response.dto';
import { SimulateScheduleResponseSchema } from '../schemas/financing.schema';

@Injectable({
  providedIn: 'root',
})
export class FinancingHttpRepository extends BaseApi implements FinancingRepository {
  private readonly assembler = inject(FinancingAssembler);

  constructor() {
    const http = inject(HttpClient);
    const baseUrl = inject(API_BASE_URL);
    super(http, `${baseUrl}/finance`);
  }

  simulateSchedule(command: SimulateScheduleCommand): Observable<AmortizationSchedule> {
    const payload: SimulateScheduleRequestDto = {
      initial_capital: command.initialCapital.toString(),
      rate_value: command.rate.toFractionString(),
      rate_type: command.rateType,
      compounding_days: command.compoundingDays,
      rate_period_days: command.ratePeriodDays ?? 360,
      customer_id: command.customerId,
      total_installments: command.totalInstallments,
      grace_days: command.graceDays ?? 0,
      first_due_date: command.firstDueDate,
    };

    return this.http
      .post<SimulateScheduleResponseDto>(`${this.basePath}/simulate`, payload)
      .pipe(
        map((response) => {
          const parseResult = SimulateScheduleResponseSchema.safeParse(response);
          if (!parseResult.success) {
            throw new AppError(
              'INVALID_RESPONSE_SCHEMA',
              'La respuesta del motor financiero no coincide con el esquema requerido',
              422,
              parseResult.error.format()
            );
          }
          return this.assembler.toScheduleFromResponse(parseResult.data as SimulateScheduleResponseDto);
        }),
        catchError((err) => this.handleError(err))
      );
  }
}
