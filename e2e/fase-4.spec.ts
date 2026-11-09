import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 4: BC Settlements (Cobranza, Mora y Prelación Art. 1257) @f4', () => {
  test('debe calcular Caso de Prueba 2 (S/ 828.69), validar imputación legal y procesar cobro', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Cargar Ventanilla de Cobranza
    await page.goto('/settlements/desk');
    await page.waitForLoadState('networkidle');

    // 2. Verificar cabecera
    await expect(page.locator('h1.page-title')).toContainText('Ventanilla de Cobranza y Liquidación Legal');

    // 3. Verificar Caso de Prueba 2 en KPIs
    await expect(page.locator('.kpi-value').nth(0)).toContainText('S/ 800.00'); // P
    await expect(page.locator('.kpi-value').nth(1)).toContainText('S/ 25.00');  // I
    await expect(page.locator('.kpi-value').nth(2)).toContainText('S/ 3.69');   // Mora 10 días al 18%
    await expect(page.locator('.kpi-value').nth(3)).toContainText('S/ 828.69'); // Total

    // 4. Verificar Prelación Legal Art. 1257 C.C.
    await expect(page.locator('.imputation-steps .step-val').nth(0)).toContainText('S/ 3.69');
    await expect(page.locator('.imputation-steps .step-val').nth(1)).toContainText('S/ 25.00');
    await expect(page.locator('.imputation-steps .step-val').nth(2)).toContainText('S/ 800.00');

    // 5. Probar rechazo de pago parcial
    const amountInput = page.locator('input[aria-label="Importe de cobranza"]');
    await amountInput.fill('500.00');

    await expect(page.locator('.alert-error')).toBeVisible();
    await expect(page.locator('.alert-error')).toContainText('Pago Parcial Rechazado');
    await expect(page.locator('button.btn-pay')).toBeDisabled();

    // 6. Restaurar pago total exacto (S/ 828.69)
    await amountInput.fill('828.69');
    await expect(page.locator('.alert-error')).not.toBeVisible();
    const payBtn = page.locator('button.btn-pay');
    await expect(payBtn).toBeEnabled();

    // 7. Procesar Cobro y verificar comprobante
    await payBtn.click();
    await expect(page.locator('.receipt-modal-content')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#receipt-title')).toContainText('COMPROBANTE DE COBRANZA');
    await expect(page.locator('.receipt-total-line')).toContainText('S/ 828.69');

    // Cerrar modal
    await page.locator('.receipt-actions button').last().click();
    await expect(page.locator('.receipt-modal-content')).not.toBeVisible();

    // 8. Navegar al Cierre Mensual
    await page.goto('/settlements/list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table.app-table')).toBeVisible();

    // 9. Navegar al Portal del Cliente
    await page.goto('/settlements/portal');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1.page-title')).toContainText('Portal de Cuentas Corrientes del Cliente');

    // 10. Auditoría de Consola limpia
    expect(consoleErrors).toEqual([]);

    // 11. Auditoría axe-core en Portal
    const portalScan = await new AxeBuilder({ page })
      .exclude('.mat-mdc-select-panel')
      .analyze();
    const criticalOrSerious = portalScan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
