## Nota de arquitectura: Responsabilidad sobre la actualización del inventario entre BC 02 y BC 04

En el sistema **Crédito Proximidad**, la gestión del inventario pertenece a **BC 02 — Catalog & Inventory Management**, mientras que el registro y la confirmación de las ventas corresponden a **BC 04 — Sales Management**.

Según el escenario 01 de la **US-04**, cuando una venta al contado o a crédito es confirmada, el stock del producto debe reducirse automáticamente.

Sin embargo, esto no significa que BC 02 deba encargarse de procesar ventas. Cada Bounded Context mantiene responsabilidades diferentes:

- **BC 02 — Catalog & Inventory Management:** administra los productos, sus existencias y las operaciones necesarias para consultar o actualizar el stock.
- **BC 04 — Sales Management:** administra las ventas y sus detalles, determina las cantidades vendidas y coordina la reducción de existencias cuando una transacción se confirma.

#### Ejemplo de funcionamiento

Supongamos que un establecimiento tiene 25 unidades de un producto y registra una venta de 3 unidades.

1. BC 04 registra y confirma la venta.
2. BC 04 solicita a BC 02 descontar las 3 unidades vendidas.
3. BC 02 actualiza las existencias del producto de 25 a 22.
4. BC 04 continúa con el procesamiento de la venta según el resultado de la operación.

#### Consideración para el desarrollo

Durante la implementación de BC 02, debemos preparar la capacidad de actualizar el stock, pero **la integración que ejecuta automáticamente ese descuento al confirmar una venta se desarrollará cuando trabajemos BC 04**.

Esta separación permite cumplir la US-04 sin duplicar responsabilidades ni introducir lógica de ventas dentro del catálogo.

**Importante:** en la implementación final, la confirmación de la venta y el descuento de inventario deberán mantenerse consistentes para evitar ventas confirmadas sin la correspondiente actualización de existencias. La coordinación transaccional de estas operaciones está relacionada con la historia técnica TS04.

**Conclusión:** BC 02 es responsable de las existencias; BC 04 es responsable de iniciar su descuento como consecuencia de una venta confirmada.
