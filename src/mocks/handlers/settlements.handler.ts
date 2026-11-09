import { http, HttpResponse } from 'msw';
import { inMemoryDb } from '../in-memory-db';

export const settlementsHandlers = [
  http.get('*/api/v1/settlements', () => {
    const list = inMemoryDb.getSettlements();
    return HttpResponse.json(list, { status: 200 });
  }),

  http.get('*/api/v1/settlements/:id/payoff-quote', ({ params, request }) => {
    const id = Number(params['id']);
    const url = new URL(request.url);
    const targetDate = url.searchParams.get('target_date') || undefined;

    try {
      const quote = inMemoryDb.getPayoffQuote(id, targetDate);
      return HttpResponse.json(quote, { status: 200 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cotizar liquidación';
      return HttpResponse.json({ code: 'QUOTE_ERROR', message: msg }, { status: 404 });
    }
  }),

  http.get('*/api/v1/settlements/:id', ({ params }) => {
    const id = Number(params['id']);
    const settlement = inMemoryDb.getSettlementById(id);
    if (!settlement) {
      return HttpResponse.json(
        { code: 'SETTLEMENT_NOT_FOUND', message: `Liquidación #${id} no encontrada` },
        { status: 404 }
      );
    }
    return HttpResponse.json(settlement, { status: 200 });
  }),

  http.post('*/api/v1/settlements/:id/pay', async ({ params, request }) => {
    const id = Number(params['id']);
    try {
      const body = (await request.json()) as {
        amount: string;
        payment_method: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE';
        reference_number?: string;
      };

      const payment = inMemoryDb.registerPayment(
        id,
        body.amount,
        body.payment_method,
        body.reference_number
      );
      return HttpResponse.json(payment, { status: 201 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar pago';
      return HttpResponse.json({ code: 'PAYMENT_FAILED', message: msg }, { status: 422 });
    }
  }),

  http.post('*/api/v1/__mock/advance-date', async ({ request }) => {
    const body = (await request.json()) as { days: number };
    const result = inMemoryDb.advanceDate(body.days || 1);
    return HttpResponse.json(result, { status: 200 });
  }),

  http.post('*/api/v1/__mock/run-cutoff', () => {
    const result = inMemoryDb.runCutoff();
    return HttpResponse.json(result, { status: 200 });
  }),
];
