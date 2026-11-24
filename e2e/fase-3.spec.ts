import { test, expect } from '@playwright/test';
import { apiBase, bearer, loginApi, storeAdmin } from './api-session';

test('rejects a sale above catalog stock without changing sales or inventory', async ({ request }) => {
  const token = await loginApi(request, storeAdmin);
  const headers = bearer(token);
  const [catalogBeforeResponse, customersResponse, salesBeforeResponse] = await Promise.all([
    request.get(`${apiBase}/catalog/products`, { headers }),
    request.get(`${apiBase}/sales/customers`, { headers }),
    request.get(`${apiBase}/sales`, { headers }),
  ]);
  expect(catalogBeforeResponse.ok()).toBeTruthy();
  expect(customersResponse.ok()).toBeTruthy();
  expect(salesBeforeResponse.ok()).toBeTruthy();

  const catalogBefore = await catalogBeforeResponse.json() as {
    id: number; name: string; stock: number; unit_price: string; allows_installments: boolean;
  }[];
  const customers = await customersResponse.json() as { id: number; full_name: string }[];
  const salesBefore = await salesBeforeResponse.json() as { id: number }[];
  const product = catalogBefore[0];
  const maria = customers.find((item) => item.full_name.toLowerCase().includes('maria'));
  expect(product).toBeTruthy();
  expect(maria).toBeTruthy();

  const quantity = product.stock + 1;
  const expectedTotal = (Number(product.unit_price) * quantity).toFixed(2);
  const rejected = await request.post(`${apiBase}/sales`, {
    headers: bearer(token, { 'Idempotency-Key': crypto.randomUUID() }),
    data: {
      customer_id: maria!.id,
      payment_mode: 'CASH',
      expected_total: expectedTotal,
      details: [{ product_id: product.id, quantity }],
    },
  });
  expect(rejected.status()).toBe(409);
  expect(await rejected.json()).toMatchObject({ code: 'INSUFFICIENT_STOCK' });

  const [catalogAfterResponse, salesAfterResponse] = await Promise.all([
    request.get(`${apiBase}/catalog/products`, { headers }),
    request.get(`${apiBase}/sales`, { headers }),
  ]);
  const catalogAfter = await catalogAfterResponse.json() as typeof catalogBefore;
  const salesAfter = await salesAfterResponse.json() as typeof salesBefore;
  expect(catalogAfter.find((item) => item.id === product.id)?.stock).toBe(product.stock);
  expect(salesAfter.map((sale) => sale.id)).toEqual(salesBefore.map((sale) => sale.id));
});
