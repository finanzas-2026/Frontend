import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './server';

describe('MSW Health Check', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('GET /api/v1/health should respond with status ok and service name', async () => {
    const response = await fetch('http://localhost/api/v1/health');
    expect(response.status).toBe(200);

    const data = (await response.json()) as { status: string; service: string; timestamp: string };
    expect(data.status).toBe('ok');
    expect(data.service).toBe('credit-proximity-fake-api');
    expect(data.timestamp).toBeDefined();
  });
});
