import { http, HttpResponse } from 'msw';
import { calculateFrenchSchedule, FrenchSimulationInput } from '../finance/french-engine';

export const financingHandlers = [
  http.post('*/api/v1/finance/simulate', async ({ request }) => {
    try {
      const body = (await request.json()) as Record<string, unknown>;

      const initialCapital = body['initial_capital'];
      const rateValue = body['rate_value'];
      const rateType = body['rate_type'];
      const totalInstallments = body['total_installments'];

      if (!initialCapital || !rateValue || !rateType || !totalInstallments) {
        return HttpResponse.json(
          {
            code: 'INVALID_SIMULATION_PARAMETERS',
            message: 'Campos requeridos: initial_capital, rate_value, rate_type, total_installments',
          },
          { status: 422 }
        );
      }

      const input: FrenchSimulationInput = {
        initialCapital: String(initialCapital),
        rateValue: String(rateValue),
        rateType: rateType as 'NOMINAL' | 'EFECTIVA',
        compoundingDays: body['compounding_days'] ? Number(body['compounding_days']) : 360,
        totalInstallments: Number(totalInstallments),
        graceDays: body['grace_days'] ? Number(body['grace_days']) : 0,
        firstDueDate: body['first_due_date'] ? String(body['first_due_date']) : undefined,
      };

      const result = calculateFrenchSchedule(input);
      return HttpResponse.json(result, { status: 200 });
    } catch (err: unknown) {
      return HttpResponse.json(
        {
          code: 'SIMULATION_ERROR',
          message: err instanceof Error ? err.message : 'Error al procesar la simulación',
        },
        { status: 400 }
      );
    }
  }),
];
