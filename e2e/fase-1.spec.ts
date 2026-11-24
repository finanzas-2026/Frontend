import { test, expect } from '@playwright/test';
import { customer, signIn, storeAdmin, superAdmin } from './api-session';

test('authenticates against Spring, restores the JWT session and opens tenant CRUD views', async ({ page }) => {
  await signIn(page, '/catalog/products', storeAdmin);
  await expect(page.getByRole('heading', { name: 'Catálogo de productos' })).toBeVisible();
  await expect(page.getByText('Saco de Arroz Extra 50kg')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Catálogo de productos' })).toBeVisible();
  await page.goto('/credit/customers');
  await expect(page.getByRole('heading', { name: 'Fichas crediticias', exact: true })).toBeVisible();
});

test('limits store management to super admins and customer routes to customers', async ({ page, context }) => {
  await signIn(page, '/stores/list', superAdmin);
  await expect(page.getByRole('heading', { name: /establecimientos|tiendas/i })).toBeVisible();
  await expect(page.getByText('Bodega Don Pepe')).toBeVisible();

  const customerPage = await context.newPage();
  await signIn(customerPage, '/settlements/portal', customer);
  await expect(customerPage.getByRole('heading', { name: 'Portal de Cuentas Corrientes del Cliente' })).toBeVisible();
  await customerPage.goto('/catalog/products');
  await expect(customerPage).toHaveURL(/\/financing\/simulator$/);
});
