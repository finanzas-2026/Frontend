import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 2: Motor de Financiamiento Francés y Simulador @f2', () => {
  test('debe permitir simular el Caso de Prueba 1 y verificar cuotas francesas con accesibilidad', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/financing/simulator');

    // Verify Page Header
    await expect(page.locator('h1')).toContainText('Simulador de Financiamiento Francés');

    // Verify initial simulation results are rendered
    const kpiCapital = page.locator('.kpi-card', { hasText: "Capital Capitalizado (P')" });
    await expect(kpiCapital).toBeVisible();
    await expect(kpiCapital).toContainText('S/ 1,515.07');

    const kpiCuota = page.locator('.kpi-card', { hasText: 'Cuota Uniforme (R)' });
    await expect(kpiCuota).toContainText('S/ 525.52');

    // Verify schedule table
    const scheduleTable = page.locator('.schedule-table');
    await expect(scheduleTable).toBeVisible();

    // Verify Grace row (Cuota 0)
    await expect(scheduleTable.locator('text=0 (Gracia Total)')).toBeVisible();

    // Verify Cuota 3 final balance is 0.00
    const rows = scheduleTable.locator('tbody tr');
    await expect(rows).toHaveCount(4); // row 0 + 3 cuotas
    const lastRow = rows.last();
    await expect(lastRow).toContainText('S/ 525.65');
    await expect(lastRow).toContainText('S/ 0.00');

    // Verify 0 uncontrolled console errors (G9)
    expect(consoleErrors).toHaveLength(0);

    // Verify accessibility with axe-core (G10)
    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
