import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fase 3: BC Sales (POS, Carrito, Línea de Crédito y Checkout) @f3', () => {
  test('debe permitir agregar productos al carrito, evaluar crédito y registrar venta con accesibilidad', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Cargar la vista de POS
    await page.goto('/sales/pos');
    await page.waitForLoadState('networkidle');

    // 2. Verificar cabecera y selector de cliente
    const headerTitle = page.locator('h1.page-title');
    await expect(headerTitle).toContainText('Punto de Venta y Crédito Comercial');

    // Verificar que los datos del cliente se renderizan
    await expect(page.locator('.credit-info-grid')).toBeVisible();

    // 3. Agregar un producto al carrito
    const firstAddBtn = page.locator('.product-item-card button').first();
    await expect(firstAddBtn).toBeVisible();
    await firstAddBtn.click();

    // 4. Verificar que el carrito tiene 1 ítem y subtotal
    const cartItem = page.locator('.cart-item-row');
    await expect(cartItem).toBeVisible();
    await expect(page.locator('.cart-card mat-card-title')).toContainText('1 unid.');

    // 5. Seleccionar modalidad Financiado en Cuotas (Francés)
    const cuotasRadio = page.getByRole('radio', { name: /Financiado en Cuotas/i });
    await cuotasRadio.click();

    // 6. Verificar que aparece el selector de cuotas y previsualización de cronograma
    await expect(page.locator('.cuotas-params-box')).toBeVisible();

    // 7. Procesar la venta
    const checkoutBtn = page.locator('button.btn-checkout');
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // 8. Esperar a que el carrito quede vacío tras procesar
    await expect(page.locator('.empty-cart-message')).toBeVisible({ timeout: 5000 });

    // 9. Navegar al historial de ventas
    await page.goto('/sales/history');
    await page.waitForLoadState('networkidle');

    const historyTable = page.locator('table.app-table');
    await expect(historyTable).toBeVisible();
    await expect(page.locator('h1.page-title')).toContainText('Historial de Ventas Registradas');

    // 10. Auditoría de Consola limpia
    expect(consoleErrors).toEqual([]);

    // 11. Auditoría axe-core en Historial
    const historyScan = await new AxeBuilder({ page })
      .exclude('.mat-mdc-select-panel')
      .analyze();
    const criticalOrSerious = historyScan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
