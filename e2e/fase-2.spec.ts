import { test, expect } from '@playwright/test';
import { apiBase, bearer, loginApi, signIn, storeAdmin } from './api-session';

test('shows the financing simulator and submits a valid schedule to the backend', async ({ page, request }) => {
  await signIn(page, '/financing/simulator');
  await expect(page.getByRole('heading', { name: 'Simulador de Financiamiento Francés' })).toBeVisible();

  const token = await loginApi(request, storeAdmin);
  const response = await request.post(`${apiBase}/finance/simulate`, {
    headers: bearer(token),
    data: {
      initial_capital: '100.00',
      rate_type: 'EFFECTIVE',
      rate_value: '0.18',
      rate_period_days: 360,
      total_installments: 12,
      grace_days: 0,
      first_due_date: '2027-01-31',
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const schedule = await response.json() as {
    tea: string;
    total_payment: string;
    total_installments: number;
    installments: { due_date: string; payment_amount: string }[];
  };
  expect(schedule.tea).toBe('0.1800000');
  expect(schedule.total_installments).toBe(12);
  expect(schedule.installments).toHaveLength(12);
  expect(Number(schedule.total_payment)).toBeGreaterThan(100);
  expect(schedule.installments[0].due_date).toBe('2027-01-31');
});

test('derives POS grace days and due dates from the selected customer contract', async ({ request }) => {
  const token = await loginApi(request, storeAdmin);
  const customersResponse = await request.get(`${apiBase}/sales/customers`, { headers: bearer(token) });
  expect(customersResponse.ok()).toBeTruthy();
  const customers = await customersResponse.json() as { id: number; full_name: string }[];
  const maria = customers.find((item) => item.full_name.toLowerCase().includes('maria'));
  expect(maria).toBeTruthy();

  const response = await request.post(`${apiBase}/finance/simulate`, {
    headers: bearer(token),
    data: {
      initial_capital: '175.00',
      customer_id: maria!.id,
      total_installments: 3,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const schedule = await response.json() as {
    grace_days: number;
    installments: { due_date: string; is_grace_period: boolean }[];
  };
  expect(schedule.grace_days).toBeGreaterThanOrEqual(0);
  expect(schedule.installments.length).toBe(3);
  expect(schedule.installments.some((item) => item.is_grace_period)).toBe(false);
  expect(schedule.installments[0].due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
