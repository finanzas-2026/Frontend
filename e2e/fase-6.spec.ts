import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoApi, operatorHeaders, signIn } from './demo-session';

test('completa venta financiada, cierre, cobro idempotente y actualización de analítica', async ({ page, request }) => {
  await signIn(page, '/sales/pos');
  await page.getByRole('combobox', { name: 'Seleccionar cliente para la venta' }).click();
  await page.getByRole('option', { name: /Ana Gómez/ }).click();
  await page.getByRole('button', { name: /Agregar Saco de Arroz/ }).click();
  await page.getByText('Financiado en Cuotas (Francés)', { exact: true }).click();
  await expect(page.getByText(/Cuota Estimada/)).toBeVisible();
  const saleResponse = page.waitForResponse((response) => response.url() === demoApi + '/sales' &&
    response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Procesar Venta' }).click();
  const sale = await saleResponse;
  expect(sale.status()).toBe(201);
  expect(await sale.json()).toMatchObject({ total_amount: '175.00', payment_mode: 'FINANCIADO_CUOTAS' });

  const headers = operatorHeaders;
  const advance = await request.post(demoApi + '/__mock/advance-date', { headers, data: { days: 45 } });
  expect(advance.ok()).toBeTruthy();
  await page.goto('/settlements/list');
  const closeResponse = page.waitForResponse((response) => response.url() === demoApi + '/settlements/cutoff');
  await page.getByRole('button', { name: 'Simular Corte Mensual' }).click();
  expect(await (await closeResponse).json()).toMatchObject({ generatedCount: 1 });
  const repeatedClose = await request.post(demoApi + '/settlements/cutoff', { headers, data: {} });
  expect(await repeatedClose.json()).toMatchObject({ generatedCount: 0 });

  await page.goto('/settlements/desk');
  await page.getByRole('button', { name: /LIQ-3/ }).click();
  const payResponse = page.waitForResponse((response) => response.url() === demoApi + '/settlements/3/pay');
  await page.getByRole('button', { name: 'Cobrar y Emitir Comprobante' }).click();
  const pay = await payResponse;
  expect(pay.ok()).toBeTruthy();
  const receipt = await pay.json();
  await expect(page.getByRole('dialog')).toContainText(receipt.receipt_number);
  const duplicate = await request.post(demoApi + '/settlements/3/pay', {
    headers, data: { amount: receipt.amount, payment_method: receipt.payment_method,
      reference_number: receipt.reference_number },
  });
  expect(await duplicate.json()).toEqual(receipt);

  await page.goto('/analytics/dashboard');
  await expect(page.locator('.kpi-card').first()).toContainText('630.00');
  await page.goto('/analytics/movements');
  await expect(page.getByText('Recibo ' + receipt.receipt_number)).toHaveCount(1);
});

test('comprueba accesibilidad sobre las vistas autenticadas y adapta el simulador a móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, '/financing/simulator');
  await expect(page.locator('.mobile-view')).toBeVisible();
  for (const path of ['/financing/simulator', '/sales/pos', '/settlements/desk', '/analytics/dashboard']) {
    await page.goto(path);
    await expect(page).toHaveURL((url) => url.pathname === path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter((item) => item.impact === 'critical'), path).toEqual([]);
  }
});
