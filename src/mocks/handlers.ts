import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/api/v1/health', () => {
    return HttpResponse.json({
      status: 'ok',
      service: 'credit-proximity-fake-api',
      timestamp: new Date().toISOString(),
    });
  }),
];
