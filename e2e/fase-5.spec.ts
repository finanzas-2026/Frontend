import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 5: BC Analytics (Dashboard Gerencial MIS y Auditoría) @f5', () => {
  test('debe visualizar los 4 KPIs ejecutivos, el gráfico comparativo de 12 meses y la bitácora de auditoría', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Navegar al Dashboard Gerencial MIS
    await page.goto('/analytics/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Verificar cabecera
    await expect(page.locator('h1.page-title')).toContainText('Panel de Control Gerencial MIS');

    // 3. Verificar las 4 tarjetas KPI ejecutivas
    const kpiValues = page.locator('.kpi-main-val');
    await expect(kpiValues.nth(0)).toContainText('14,850.00'); // Ingresos Totales
    await expect(kpiValues.nth(1)).toContainText('828.69');    // Cartera Vencida
    await expect(kpiValues.nth(2)).toContainText('42 clientes'); // Cuentas Activas
    await expect(kpiValues.nth(3)).toContainText('5.58');      // Tasa Morosidad

    // 4. Verificar contenedor del gráfico comparativo de 12 meses
    const chartContainer = page.locator('.chart-container');
    await expect(chartContainer).toBeVisible();
    const barGroups = chartContainer.locator('.bar-group');
    await expect(barGroups).toHaveCount(12);

    // Verificar barras de ventas y cobranza
    await expect(chartContainer.locator('.bar-sales').first()).toBeVisible();
    await expect(chartContainer.locator('.bar-collected').first()).toBeVisible();

    // 5. Navegar a la bitácora de auditoría de movimientos
    await page.goto('/analytics/movements');
    await page.waitForLoadState('networkidle');

    // 6. Verificar cabecera de auditoría
    await expect(page.locator('h1.page-title')).toContainText('Auditoría General de Movimientos y Cuentas');

    // 7. Verificar tabla de auditoría con movimientos
    const table = page.locator('table.app-table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(4);

    // 8. Verificar sin errores de consola
    expect(consoleErrors).toEqual([]);

    // 9. Auditoría de accesibilidad Axe en Dashboard y Auditoría
    const dashboardScan = await new AxeBuilder({ page })
      .exclude('.mat-mdc-select-panel')
      .analyze();
    const criticalOrSerious = dashboardScan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
