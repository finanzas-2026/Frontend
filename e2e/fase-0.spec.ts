import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 0: Carga Inicial Limpia @f0', () => {
  test('debe cargar la aplicación sin errores en consola y pasar auditoría básica de accesibilidad', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for the app-root component to render
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();

    // Verify 0 uncontrolled console errors (G9)
    expect(consoleErrors).toHaveLength(0);

    // Verify accessibility with axe-core (G10)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
