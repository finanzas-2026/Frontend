import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apiBase, bearer, loginApi, signIn } from './api-session';

test('registers all sale modes, closes the cycle and collects a payment with surplus', async ({ page, request }) => {
  test.setTimeout(90_000);
  await signIn(page, '/sales/pos');
  const token = await loginApi(request);
  const headers = bearer(token);
  let customerId = 0;

  for (const [mode, label] of [
    ['CASH', 'Contado Efectivo'],
    ['MONTH_END', 'Financiado a Cierre Mensual'],
    ['INSTALLMENTS', 'Financiado en Cuotas (Francés)'],
  ] as const) {
    await page.goto('/sales/pos');
    await page.getByRole('combobox', { name: 'Seleccionar cliente para la venta' }).click();
    await page.getByRole('option', { name: /Mar[ií]a Quispe/i }).click();
    await page.getByRole('button', { name: /Agregar Saco de Arroz/i }).click();
    await page.getByText(label, { exact: true }).click();
    const response = page.waitForResponse((res) =>
      new URL(res.url()).pathname === apiBase + '/sales' && res.request().method() === 'POST');
    await page.getByRole('button', { name: 'Procesar Venta' }).click();
    const sale = await response;
    expect(sale.ok(), await sale.text()).toBeTruthy();
    const stored = await sale.json();
    expect(stored.payment_mode).toBe(mode);
    customerId = stored.customer_id;
  }

  const profilePath = apiBase + '/customers/' + customerId;
  const profile = await (await request.get(profilePath, { headers })).json();
  const locked = await request.put(profilePath, { headers, data: { ...profile, cutoff_day: 10 } });
  expect(locked.status()).toBe(409);
  expect(await locked.json()).toMatchObject({ code: 'ACTIVE_DEBT_TERMS_LOCKED' });
  const contact = await request.put(profilePath, { headers, data: { ...profile, phone_number: '987654322' } });
  expect(contact.ok(), await contact.text()).toBeTruthy();

  const advance = await request.post(apiBase + '/__test/clock/advance', { headers, data: { days: 1 } });
  expect(advance.ok(), await advance.text()).toBeTruthy();
  await page.goto('/settlements/list');
  const cutoffResponse = page.waitForResponse((res) => res.url().endsWith('/settlements/cutoff'));
  await page.getByRole('button', { name: 'Ejecutar corte mensual' }).click();
  expect((await (await cutoffResponse).json()).generatedCount).toBeGreaterThan(0);
  const repeated = await request.post(apiBase + '/settlements/cutoff', { headers });
  expect(await repeated.json()).toMatchObject({ generatedCount: 0 });

  const statements = await (await request.get(apiBase + '/settlements', { headers })).json();
  const statement = statements.find((row: { customer_id: number; status: string }) =>
    row.customer_id === customerId && row.status === 'PENDING');
  expect(statement).toBeTruthy();
  const payPath = apiBase + '/settlements/' + statement.id + '/pay';
  await page.goto('/settlements/desk');
  await page.getByRole('button', { name: new RegExp(statement.code) }).click();
  const amount = page.getByRole('textbox', { name: 'Importe de cobranza' });
  await amount.fill('0.01');
  await expect(page.getByRole('button', { name: 'Cobrar y Emitir Comprobante' })).toBeDisabled();
  await amount.fill((Number(statement.total_due) + 20).toFixed(2));
  const payResponse = page.waitForResponse((res) => res.url().endsWith(payPath));
  await page.getByRole('button', { name: 'Cobrar y Emitir Comprobante' }).click();
  const payment = await payResponse;
  expect(payment.ok(), await payment.text()).toBeTruthy();
  const receipt = await payment.json();
  await expect(page.getByRole('dialog')).toContainText(receipt.receipt_number);
  await expect(page.getByRole('dialog')).toContainText('Interés compensatorio:');
  expect(Number(receipt.received_amount) - Number(receipt.amount)).toBeCloseTo(20, 2);

  const key = payment.request().headers()['idempotency-key'];
  expect(key).toBeTruthy();
  const retry = await request.post(payPath, {
    headers: bearer(token, { 'Idempotency-Key': key }),
    data: payment.request().postDataJSON(),
  });
  expect(await retry.json()).toEqual(receipt);
  const kpis = await (await request.get(apiBase + '/analytics/kpis', { headers })).json();
  expect(Number(kpis.total_revenue)).toBeGreaterThan(0);
});

test('keeps the simulator usable in a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, '/financing/simulator');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.filter((item) => item.impact === 'critical')).toEqual([]);
});
