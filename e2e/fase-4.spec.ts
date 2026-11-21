import { test, expect } from '@playwright/test';
import { signIn } from './demo-session';

test('muestra la cotización y deshabilita cobros parciales o mayores al total', async ({ page }) => {
  await signIn(page, '/settlements/desk');
  const amount = page.getByRole('textbox', { name: 'Importe de cobranza' });
  const pay = page.getByRole('button', { name: 'Cobrar y Emitir Comprobante' });
  await expect(amount).toBeVisible();
  const exact = await amount.inputValue();
  await amount.fill('1.00');
  await expect(pay).toBeDisabled();
  await amount.fill('9999.00');
  await expect(pay).toBeDisabled();
  await amount.fill(exact);
  await expect(pay).toBeEnabled();
});


test('el cliente consulta sus liquidaciones desde el portal autenticado', async ({ page }) => {
  await signIn(page, '/settlements/portal', 'CUSTOMER');
  await expect(page.getByRole('heading', { name: 'Portal de Cuentas Corrientes del Cliente' })).toBeVisible();
  await expect(page.getByText('LIQ-2', { exact: true })).toBeVisible();
  await expect(page.getByText('S/ 286.60', { exact: true })).not.toHaveCount(0);
});
