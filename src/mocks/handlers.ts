import { http, HttpResponse } from 'msw';
import { financingHandlers } from './handlers/financing.handler';

export const handlers = [
  http.get('*/api/v1/health', () => {
    return HttpResponse.json({
      status: 'ok',
      service: 'credit-proximity-fake-api',
      timestamp: new Date().toISOString(),
    });
  }),
  ...financingHandlers,
];
