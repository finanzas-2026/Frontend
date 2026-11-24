import { test, expect } from '@playwright/test';
import { apiBase, bearer, loginApi, signIn, storeAdmin } from './api-session';

test('shows tenant-scoped KPIs and monthly flows from the backend', async ({ page, request }) => {
  await signIn(page, '/analytics/dashboard');
  await expect(page.getByRole('heading', { name: 'Panel de Control Gerencial MIS' })).toBeVisible();
  await expect(page.locator('.kpi-card')).toHaveCount(4);
  await expect(page.locator('.chart-container')).toBeVisible();

  const token = await loginApi(request, storeAdmin);
  const response = await request.get(`${apiBase}/analytics/kpis`, { headers: bearer(token) });
  expect(response.ok()).toBeTruthy();
  const kpis = await response.json() as {
    total_revenue: string;
    overdue_portfolio: string;
    active_accounts: number;
    default_rate: string;
  };
  expect(Number(kpis.total_revenue)).toBeGreaterThanOrEqual(0);
  expect(Number(kpis.overdue_portfolio)).toBeGreaterThanOrEqual(0);
  expect(kpis.active_accounts).toBeGreaterThan(0);
  expect(Number(kpis.default_rate)).toBeGreaterThanOrEqual(0);
  expect(Number(kpis.default_rate)).toBeLessThanOrEqual(1);
});
