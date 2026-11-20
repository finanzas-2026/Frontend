# Arquitectura del Sistema — Crédito Proximidad

Este documento reúne las responsabilidades de los Bounded Contexts, sus dependencias y las decisiones de diseño del sistema. Los requisitos funcionales se documentan por separado en las Epics.

## 1. Bounded Contexts

De acuerdo con el diagrama entidad-relación del proyecto, el sistema se organiza en seis Bounded Contexts:

| Bounded Context | Nombre | Entidades principales |
|---|---|---|
| BC 01 | IAM & Tenant Management | `Stores`, `Users` |
| BC 02 | Catalog & Inventory Management | `Products` |
| BC 03 | Credit Management | `Customers` |
| BC 04 | Sales Management | `Sales`, `SaleDetails` |
| BC 05 | Financial Management | `AmortizationSchedules` |
| BC 06 | Settlement & Collection Management | `MonthlySettlements`, `Payments` |

La distribución detallada de atributos y relaciones se encuentra en [`database-diagram.md`](database-diagram.md).

## 2. Integración entre Bounded Contexts

### 2.1. BC 02 — Catalog & Inventory Management y BC 04 — Sales Management

En el sistema **Crédito Proximidad**, la gestión del inventario pertenece a **BC 02 — Catalog & Inventory Management**, mientras que el registro y la confirmación de las ventas corresponden a **BC 04 — Sales Management**.

Según el escenario 01 de la **US-04**, cuando una venta al contado o a crédito es confirmada, las existencias del producto deben reducirse automáticamente.

Esto no significa que BC 02 deba procesar ventas. Las responsabilidades se delimitan de la siguiente manera:

- **BC 02 — Catalog & Inventory Management:** administra los productos y sus existencias; proporciona operaciones para consultar, validar y actualizar el stock.
- **BC 04 — Sales Management:** administra las ventas y sus detalles, determina las cantidades vendidas y coordina la actualización de existencias durante la confirmación de la transacción.

#### Ejemplo de funcionamiento

Supongamos que un establecimiento tiene **25 unidades** de un producto y prepara una venta de **3 unidades**.

1. BC 04 prepara la venta y determina los productos y las cantidades que se venderán.
2. BC 04 solicita a BC 02 validar y descontar las 3 unidades del producto.
3. Si la operación es válida, BC 02 actualiza las existencias de **25 a 22**.
4. BC 04 confirma la venta **solo si se completan correctamente las operaciones necesarias**, incluida la actualización del inventario.

Esta secuencia describe la **coordinación lógica esperada**, no un mecanismo transaccional ya implementado.

#### Consideración para el desarrollo

Durante el desarrollo de BC 02, se preparará la capacidad de actualizar el stock. **La integración que ejecuta automáticamente el descuento asociado a una venta se desarrollará al trabajar BC 04**.

Esta separación permite atender la responsabilidad de inventario prevista en la **US-04** sin duplicar la lógica de ventas dentro del catálogo.

## 3. Decisiones Arquitectónicas

### 3.1. Consistencia entre venta e inventario

La confirmación de una venta y su correspondiente descuento de inventario deben mantenerse consistentes: una venta no debe quedar confirmada sin reflejar las existencias consumidas.

Esta necesidad se relaciona con la historia técnica **TS04 — Transacciones Atómicas para Inventario**.

Mientras se utilice **JSON Server** como persistencia temporal, la coordinación entre solicitudes HTTP no equivale a una transacción atómica. Por ello, el mecanismo que garantice dicha consistencia quedará definido al implementar la integración de BC 04 y la historia técnica TS04.

**Criterio de responsabilidad:** BC 02 es responsable de las existencias; BC 04 inicia y coordina su descuento como consecuencia de una venta.
