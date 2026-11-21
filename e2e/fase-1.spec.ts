import { test, expect } from '@playwright/test';
import { signIn } from './demo-session';

test('mantiene las rutas existentes de Catálogo, Inventario y Crédito tras iniciar sesión', async ({ page }) => {
  await signIn(page, '/catalog/products');
  await expect(page.getByRole('heading', { name: 'Catálogo de productos' })).toBeVisible();
  await expect(page.getByText('Saco de Arroz Extra 50kg')).toBeVisible();
  await page.goto('/catalog/inventory');
  await expect(page.getByRole('heading', { name: 'Monitor de inventario' })).toBeVisible();
  await page.goto('/credit/customers');
  await expect(page.getByRole('heading', { name: 'Fichas crediticias', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '1,500.00', exact: true })).toBeVisible();
});
