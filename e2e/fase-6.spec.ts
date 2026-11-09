import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 6: Suite Integral E2E, Responsividad y Accesibilidad @f6', () => {
  test('Flujo completo de negocio: Finanzas -> Ventas POS -> Liquidación/Cobranza -> MIS Analytics', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // -------------------------------------------------------------
    // 1. FINANCING: Simulación de Cronograma Francés
    // -------------------------------------------------------------
    await page.goto('/financing/simulator');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1.page-title')).toContainText('Simulador de Financiamiento Francés');

    await page.locator('input[formControlName="initialCapital"]').fill('1500');
    await page.locator('input[formControlName="rateValue"]').fill('24');
    await page.locator('input[formControlName="totalInstallments"]').fill('3');
    await page.locator('input[formControlName="graceDays"]').fill('15');

    await page.locator('button[type="submit"]').click();
    const scheduleTable = page.locator('.schedule-table');
    await expect(scheduleTable).toBeVisible();

    // Validar ajuste terminal Sn = 0.00
    const scheduleRows = scheduleTable.locator('tbody tr');
    await expect(scheduleRows).toHaveCount(4); // Fila 0 (gracia) + 3 cuotas
    const lastRow = scheduleRows.last();
    await expect(lastRow).toContainText('S/ 0.00'); // Saldo Final Cuota 3

    // -------------------------------------------------------------
    // 2. SALES: Emisión de Venta en Mostrador POS
    // -------------------------------------------------------------
    await page.goto('/sales/pos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1.page-title')).toContainText('Punto de Venta y Crédito Comercial');
    await expect(page.locator('.credit-info-grid')).toBeVisible();

    // Agregar producto al carrito
    const firstAddBtn = page.locator('.product-item-card button').first();
    await expect(firstAddBtn).toBeVisible();
    await firstAddBtn.click();

    // Seleccionar modalidad cuotas
    const cuotasRadio = page.getByRole('radio', { name: /Financiado en Cuotas/i });
    await cuotasRadio.click();

    // Emitir venta
    const checkoutBtn = page.locator('button.btn-checkout');
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();
    await expect(page.locator('.empty-cart-message')).toBeVisible({ timeout: 5000 });

    // Verificar en historial
    await page.goto('/sales/history');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table.app-table')).toBeVisible();

    // -------------------------------------------------------------
    // 3. SETTLEMENTS: Cobranza Legal Art. 1257 en Ventanilla
    // -------------------------------------------------------------
    await page.goto('/settlements/desk');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1.page-title')).toContainText('Ventanilla de Cobranza y Liquidación Legal');

    // Validar montos del Caso de Prueba 2 (S/ 828.69)
    await expect(page.locator('.kpi-value').nth(3)).toContainText('S/ 828.69');

    // Pago parcial rechazado
    const amountInput = page.locator('input[aria-label="Importe de cobranza"]');
    await amountInput.fill('400.00');
    await expect(page.locator('.alert-error')).toBeVisible();

    // Pago total exacto
    await amountInput.fill('828.69');
    await expect(page.locator('.alert-error')).not.toBeVisible();
    await page.locator('button.btn-pay').click();

    // Modal de comprobante
    await expect(page.locator('.receipt-modal-content')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#receipt-title')).toContainText('COMPROBANTE DE COBRANZA');
    await page.locator('.receipt-actions button').last().click();

    // -------------------------------------------------------------
    // 4. ANALYTICS: Panel Gerencial MIS y Auditoría
    // -------------------------------------------------------------
    await page.goto('/analytics/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1.page-title')).toContainText('Panel de Control Gerencial MIS');

    // Validar 4 KPIs
    const kpis = page.locator('.kpi-main-val');
    await expect(kpis.nth(0)).toContainText('14,850.00');
    await expect(kpis.nth(1)).toContainText('828.69');
    await expect(kpis.nth(2)).toContainText('42 clientes');
    await expect(kpis.nth(3)).toContainText('5.58');

    // Validar gráfico de 12 meses
    await expect(page.locator('.chart-container')).toBeVisible();

    // Validar bitácora de auditoría
    await page.goto('/analytics/movements');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table.app-table tbody tr')).toHaveCount(4);

    // Consola libre de errores
    expect(consoleErrors).toEqual([]);
  });

  test('Responsividad: Verificación en viewport móvil (375x667) y desktop (1280x800)', async ({
    page,
  }) => {
    // 1. Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analytics/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.shell-toolbar')).toBeVisible();
    await expect(page.locator('.kpi-cards-grid')).toBeVisible();
    await expect(page.locator('.chart-container')).toBeVisible();
    await expect(page.locator('.mobile-bottom-bar')).toBeVisible();

    // 2. Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/settlements/desk');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.shell-sidebar')).toBeVisible();
    await expect(page.locator('.desk-layout')).toBeVisible();
    await expect(page.locator('.imputation-steps')).toBeVisible();
  });

  test('Accesibilidad WCAG 2.1 AA en todas las vistas principales', async ({ page }) => {
    const urls = [
      '/financing/simulator',
      '/sales/pos',
      '/settlements/desk',
      '/analytics/dashboard',
    ];

    for (const url of urls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const scan = await new AxeBuilder({ page })
        .exclude('.mat-mdc-select-panel')
        .analyze();

      const criticalOrSerious = scan.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalOrSerious, `Violaciones de accesibilidad en ${url}`).toHaveLength(0);
    }
  });
});
