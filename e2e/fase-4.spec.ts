import { test, expect } from '@playwright/test';
import { customer, signIn } from './api-session';

test('customer can open only the authenticated account portal', async ({ page }) => {
  await signIn(page, '/settlements/portal', customer);
  await expect(page.getByRole('heading', { name: 'Portal de Cuentas Corrientes del Cliente' })).toBeVisible();
  await expect(page.getByText('Detalle de Liquidaciones Mensuales', { exact: true })).toBeVisible();
});

test('store admin can open the collection desk backed by real settlement data', async ({ page }) => {
  await signIn(page, '/settlements/desk');
  await expect(page.getByRole('heading', { name: 'Ventanilla de Cobranza y Liquidación Legal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Liquidaciones Activas' }).or(
    page.getByRole('heading', { name: 'No hay liquidaciones pendientes de cobro' }),
  )).toBeVisible();
});
