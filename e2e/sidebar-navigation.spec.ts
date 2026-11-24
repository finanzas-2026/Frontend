import { expect, test } from '@playwright/test';
import { signIn, storeAdmin, customer, superAdmin } from './api-session';

test('store-admin sidebar links reach their routes and highlight the active view', async ({ page }) => {
  await signIn(page, '/sales/pos', storeAdmin);

  const routes = [
    { label: 'Panel gerencial', path: '/analytics/dashboard' },
    { label: 'Auditoría de Movimientos', path: '/analytics/movements' },
    { label: 'Mostrador POS', path: '/sales/pos' },
    { label: 'Historial de Ventas', path: '/sales/history' },
    { label: 'Simulador de Cuotas', path: '/financing/simulator' },
    { label: 'Ventanilla de Cobro', path: '/settlements/desk' },
    { label: 'Cierres Mensuales', path: '/settlements/list' },
    { label: 'Catálogo de Productos', path: '/catalog/products' },
    { label: 'Fichas Crediticias', path: '/credit/customers' },
  ];

  await expect(page.locator('.sidebar-nav .nav-link')).toHaveCount(routes.length);

  for (const route of routes) {
    const link = page.getByRole('link', { name: route.label, exact: true });
    await expect(link).toHaveAttribute('href', route.path);
    await link.click();
    await expect(page).toHaveURL((url) => url.pathname === route.path);

    const activeLink = page.locator('.sidebar-nav .nav-link.active-nav-link');
    await expect(activeLink).toHaveCount(1);
    await expect(activeLink).toHaveText(route.label);
    await expect(activeLink).toHaveAttribute('aria-current', 'page');
    await expect(activeLink).toHaveCSS('background-color', 'rgb(3, 105, 161)');
    await expect(activeLink).toHaveCSS('color', 'rgb(255, 255, 255)');
  }

  await page.goto('/catalog/products/new');
  await expect(page.locator('.sidebar-nav .nav-link.active-nav-link')).toHaveText('Catálogo de Productos');

  await page.getByRole('button', { name: 'Abrir perfil de pepe.admin' }).click();
  const profileMenu = page.locator('.profile-menu-panel');
  await expect(profileMenu).toBeVisible();
  await expect(profileMenu.getByText('pepe.admin', { exact: true })).toBeVisible();
  await expect(profileMenu.getByText('pepe@bodega.pe', { exact: true })).toBeVisible();
  await expect(profileMenu.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible();
  await expect(profileMenu).toHaveCSS('border-radius', '12px');
});

test('customer navigation exposes only customer views and highlights the portal', async ({ page }) => {
  await signIn(page, '/settlements/portal', customer);

  const links = page.locator('.sidebar-nav .nav-link');
  await expect(links).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Portal del Cliente', exact: true })).toHaveAttribute(
    'href',
    '/settlements/portal',
  );
  await expect(page.getByRole('link', { name: 'Simulador de Cuotas', exact: true })).toHaveAttribute(
    'href',
    '/financing/simulator',
  );
  await expect(page.locator('.sidebar-nav .nav-link.active-nav-link')).toHaveText('Portal del Cliente');
});

test('super-admin navigation reaches store management and stays selected on store subroutes', async ({ page }) => {
  await signIn(page, '/stores/list', superAdmin);

  const storeLink = page.getByRole('link', { name: 'Gestión de Tiendas', exact: true });
  await expect(page.locator('.sidebar-nav .nav-link')).toHaveCount(1);
  await expect(storeLink).toHaveAttribute('href', '/stores');
  await storeLink.click();
  await expect(page).toHaveURL((url) => url.pathname === '/stores/list');
  await expect(page.locator('.sidebar-nav .nav-link.active-nav-link')).toHaveText('Gestión de Tiendas');

  await page.goto('/stores/new');
  await expect(page.locator('.sidebar-nav .nav-link.active-nav-link')).toHaveText('Gestión de Tiendas');
});
