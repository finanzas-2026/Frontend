import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 1: AppShell y Navegación @f1', () => {
  test('debe renderizar el shell responsivo con navegación y pasar accesibilidad', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Check AppShell brand title
    const brand = page.locator('.brand-title');
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText('Crédito Proximidad');

    // Check navigation items exist
    await expect(page.getByRole('link', { name: 'Dashboard MIS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Simulador de Cuotas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mostrador POS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ventanilla de Cobro' })).toBeVisible();

    // Verify 0 uncontrolled console errors
    expect(consoleErrors).toHaveLength(0);

    // Verify accessibility with axe-core
    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
