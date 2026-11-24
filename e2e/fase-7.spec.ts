import { expect, test, type Page } from '@playwright/test';
import { apiBase, bearer, loginApi, signIn, superAdmin } from './api-session';

async function fill(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [field, value] of Object.entries(fields)) {
    await page.locator('[formControlName="' + field + '"]').fill(value);
  }
}

test('provisions and suspends a store and persists its customer and product', async ({ page, context, request }) => {
  test.setTimeout(60_000);
  const suffix = String(Date.now()).slice(-8);
  const storeName = 'Bodega de Prueba ' + suffix;
  const productName = 'Producto de Prueba ' + suffix;
  const username = 'tienda.' + suffix;
  const admin = { identifier: username, password: 'Prueba2026' };

  await signIn(page, '/stores/new', superAdmin);
  await fill(page, { businessName: storeName, taxId: '205' + suffix, address: 'Av. Prueba 120' });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await fill(page, {
    firstName: 'Ana', lastName: 'Pérez', email: username + '@ejemplo.test',
    username, password: admin.password, confirmPassword: admin.password,
  });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Crear tienda y cuenta' }).click();
  await expect(page.getByRole('heading', { name: 'Registro completado' })).toBeVisible();

  const shop = await context.newPage();
  await signIn(shop, '/credit/customers/new', admin);
  const customerName = 'Rosa ' + suffix;
  const customerUsername = 'cliente.' + suffix;
  await fill(shop, {
    firstName: 'Rosa', lastName: suffix, email: customerUsername + '@ejemplo.test',
    username: customerUsername, password: 'Cliente2026', confirmPassword: 'Cliente2026',
    homeAddress: 'Calle Lima 45', phoneNumber: '987654321', creditLimit: '1200',
    cutoffDay: '25', paymentDueDay: '5', compensatoryRateValue: '24', penaltyRateValue: '18',
  });
  await shop.getByRole('button', { name: 'Registrar cliente' }).click();
  await expect(shop.getByText(customerName)).toBeVisible();

  await shop.goto('/catalog/products/new');
  await fill(shop, { name: productName, cashPrice: '5.00', creditListPrice: '6.00', currentStock: '12', minStock: '2' });
  await shop.getByRole('button', { name: 'Crear producto' }).click();
  await expect(shop.getByText(productName)).toBeVisible();
  await shop.reload();
  await expect(shop.getByText(productName)).toBeVisible();

  const adminToken = await loginApi(request, admin);
  const catalog = await (await request.get(apiBase + '/catalog/products', { headers: bearer(adminToken) })).json();
  const product = catalog.find((item: { name: string }) => item.name === productName);
  expect(product.stock).toBe(12);
  await shop.goto('/catalog/products/' + product.id + '/edit');
  await fill(shop, { currentStock: '4' });
  await shop.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(shop.getByText(productName)).toBeVisible();

  const productPatch = shop.waitForResponse((response) =>
    response.request().method() === 'PATCH' && response.url().endsWith('/products/' + product.id));
  await shop.getByRole('button', { name: 'Desactivar ' + productName }).click();
  await shop.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
  expect((await productPatch).ok()).toBeTruthy();
  const archived = await (await request.get(apiBase + '/products/' + product.id, { headers: bearer(adminToken) })).json();
  expect(archived).toMatchObject({ current_stock: 4, status: 'DISCONTINUED' });
  const otherToken = await loginApi(request);
  const visible = await (await request.get(apiBase + '/catalog/products', { headers: bearer(otherToken) })).json();
  expect(visible.some((product: { name: string }) => product.name === productName)).toBeFalsy();

  await page.goto('/stores/list');
  await page.getByRole('row', { name: new RegExp(storeName) }).getByRole('button', { name: 'Desactivar' }).click();
  const suspension = page.waitForResponse((response) =>
    response.request().method() === 'PATCH' && response.url().includes('/stores/'));
  await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
  expect((await suspension).ok()).toBeTruthy();
  const stopped = await request.get(apiBase + '/auth/me', { headers: bearer(adminToken) });
  expect([401, 403]).toContain(stopped.status());
});
