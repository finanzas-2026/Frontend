import { test, expect } from '@playwright/test';
import { demoApi, operatorHeaders, signIn } from './demo-session';

test('rechaza ventas sin existencias o cupo y conserva stock, saldos y ventas', async ({ request }) => {
  const headers = operatorHeaders;
  const resources = ['/catalog/products', '/sales/customers', '/sales'];
  const snapshot = () => Promise.all(resources.map(async (resource) =>
    (await request.get(demoApi + resource, { headers })).json()));
  const before = await snapshot();
  for (const quantity of [26, 9]) {
    const rejected = await request.post(demoApi + '/sales', { headers, data: {
      customer_id: 1, store_id: 1, payment_mode: 'FINANCIADO_CUOTAS', installments_count: 3,
      details: [{ product_id: 1, quantity }],
    } });
    expect(rejected.status()).toBe(409);
    expect((await rejected.json()).message).toContain(quantity === 26 ? 'Existencias insuficientes' : 'Cupo insuficiente');
    expect(await snapshot()).toEqual(before);
  }
});

test('requiere seleccionar al cliente y muestra el precio a crédito', async ({ page }) => {
  await signIn(page, '/sales/pos');
  await page.getByRole('button', { name: /Agregar Saco de Arroz/ }).click();
  await expect(page.getByRole('button', { name: 'Procesar Venta' })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Seleccionar cliente para la venta' }).click();
  await page.getByRole('option', { name: /Ana Gómez/ }).click();
  await page.getByText('Financiado en Cuotas (Francés)', { exact: true }).click();
  await expect(page.getByText(/Cuota Estimada/)).toBeVisible();
  await expect(page.locator('.grand-total')).toContainText('175.00');
});
