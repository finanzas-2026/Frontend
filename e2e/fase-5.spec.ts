import { test, expect } from '@playwright/test';
import { demoApi, operatorHeaders, signIn } from './demo-session';

test('concilia los ingresos con las ventas y muestra el tablero autenticado', async ({ page, request }) => {
  await signIn(page, '/analytics/dashboard');
  await expect(page.locator('.kpi-card')).toHaveCount(4);
  await expect(page.locator('.chart-container')).toBeVisible();
  const options = { headers: operatorHeaders };
  const sales = await (await request.get(demoApi + '/sales', options)).json() as { total_amount: string }[];
  const kpis = await (await request.get(demoApi + '/analytics/kpis', options)).json();
  expect(kpis.total_revenue).toBe(sales.reduce((total, row) => total + Number(row.total_amount), 0).toFixed(2));
});
