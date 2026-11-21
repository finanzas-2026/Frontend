import { test, expect } from '@playwright/test';
import { demoApi, signIn } from './demo-session';

test('muestra un cronograma calculado por la API después del inicio de sesión', async ({ page }) => {
  await signIn(page, '/financing/simulator');
  await expect(page.getByRole('heading', { name: 'Simulador de Financiamiento Francés' })).toBeVisible();
  await expect(page.locator('.schedule-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.schedule-table tbody tr').last()).toContainText('0.00');
  await expect(page.locator('.schedule-table')).toContainText('525.56');
});

test('valida unidades y períodos en el contrato del simulador', async ({ request }) => {
  const data = { initial_capital: '100.00', rate_value: '0.18', rate_type: 'EFECTIVA',
    rate_period_days: 360, total_installments: 12, first_due_date: '2027-01-31' };
  const simulated = await request.post(demoApi + '/finance/simulate', { data });
  expect(simulated.ok()).toBeTruthy();
  expect(await simulated.json()).toMatchObject({ tea: '0.1800000', total_payment: '109.26' });
  const weekly = await request.post(demoApi + '/finance/simulate', {
    data: { ...data, rate_type: 'NOMINAL', compounding_days: 7 },
  });
  expect(weekly.status()).toBe(422);
  expect((await weekly.json()).message).toContain('Capitalización semanal pendiente');
});
