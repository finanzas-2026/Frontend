# Arquitectura del Sistema — Crédito Proximidad

Este documento reúne las responsabilidades de los Bounded Contexts, sus dependencias y las decisiones de diseño del sistema. Los requisitos funcionales se documentan por separado en los archivos de requisitos, incluyendo las Epics y `credit-requeriments.md`.

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

### 2.2. BC 01 — IAM & Tenant Management y BC 03 — Credit Management (US-05)

La **US-05 — Formulario de Ficha Crediticia del Cliente** requiere registrar un cliente y configurar las condiciones bajo las cuales podrá comprar a crédito. Aunque `Users` y `Customers` se relacionan, **no representan la misma entidad ni deben administrarse desde el mismo contexto**.

- **BC 01 — IAM & Tenant Management:** mantiene la identidad del usuario, su autenticación, rol, estado y pertenencia a un establecimiento.
- **BC 03 — Credit Management:** mantiene el perfil comercial-crediticio del cliente (`Customers`), asociado mediante `user_id` y `store_id`; administra límite de crédito, plazos, días de corte y pago, tasas, moneda y saldo a favor.

**Descargo de responsabilidad:** registrar o modificar un perfil `Customer` no equivale a crear ni autenticar un `User`. BC 03 consume o referencia la identidad gestionada por IAM, pero no asume la gestión de credenciales o permisos.

**Criterio de implementación:** los valores de las tasas nominales o efectivas deben permitir la precisión de **hasta siete decimales** exigida en el escenario 02 de US-05. BC 03 conserva su configuración; las operaciones matemáticas que utilicen esas tasas corresponden a BC 05 cuando requieran cálculo financiero.

### 2.3. BC 03 — Credit Management y BC 04 — Sales Management (US-06)

La **US-06 — Pantalla de Registro de Ventas y Verificador de Crédito** requiere comprobar el cupo disponible antes de confirmar una compra y actualizarlo dinámicamente después de una operación.

- **BC 03 — Credit Management:** define y proporciona el límite y las condiciones crediticias vigentes del cliente. Participa en la evaluación de si una compra respeta los parámetros autorizados.
- **BC 04 — Sales Management:** gestiona la selección de productos, calcula el importe de la venta, presenta el aviso de cupo insuficiente, bloquea la confirmación cuando corresponda y coordina el registro de la venta.
- **BC 06 — Settlement & Collection Management:** proporciona, cuando corresponda, información de las obligaciones pendientes y pagos registrados necesaria para determinar la deuda vigente del cliente.

#### Ejemplo de funcionamiento

Un cliente tiene un **límite de crédito de S/ 1 500**, una deuda activa de **S/ 1 200** y pretende realizar una compra de **S/ 400**.

1. BC 04 obtiene el importe de la compra e inicia la verificación del crédito.
2. Se consideran las condiciones de BC 03 y la deuda vigente consolidada a partir de las operaciones pertinentes.
3. Como **S/ 1 200 + S/ 400 > S/ 1 500**, BC 04 impide confirmar la compra y presenta el aviso correspondiente.
4. Si el importe estuviera dentro del límite, BC 04 podría continuar con la confirmación y posteriormente se reflejaría la nueva disponibilidad de crédito.

**Descargo de responsabilidad:** BC 03 no registra ventas ni controla la pantalla de caja. BC 04 no administra los parámetros crediticios del perfil. La deuda usada para verificar el cupo debe ser consistente y evitar contar dos veces una misma obligación al combinar ventas, cuotas y liquidaciones.

**Consideración para el desarrollo:** la verificación realizada por la interfaz no sustituye la validación definitiva durante la confirmación de una venta. El mecanismo transaccional se determinará al integrar BC 04 con los demás contextos y el backend real.

### 2.4. BC 03 — Credit Management, BC 05 — Financial Management y BC 04 — Sales Management (US-07)

La **US-07 — Generación Visual del Plan de Cuotas** requiere previsualizar un cronograma de amortización antes de confirmar una compra financiada en meses.

- **BC 03 — Credit Management:** suministra las condiciones del cliente necesarias para la simulación, como tasas, plazo máximo, fecha de corte y día de pago.
- **BC 05 — Financial Management:** es responsable de calcular el cronograma mediante el **método francés**, la base comercial **360/30**, los intereses, la capitalización aplicable durante los días de gracia y el desglose por cuota. Su entidad principal es `AmortizationSchedules`.
- **BC 04 — Sales Management:** integra la previsualización dentro del flujo de compra y coordina su uso antes de confirmar la venta.

**Descargo de responsabilidad:** BC 03 no implementa el algoritmo francés ni genera cronogramas; BC 04 no debe duplicar los cálculos de BC 05. Una **previsualización** no debe considerarse por sí misma una venta confirmada ni un cronograma persistido.

### 2.5. BC 03 — Credit Management y BC 06 — Settlement & Collection Management (US-08)

La **US-08 — Vista de Estado de Cuenta y Liquidación Mensual** requiere consolidar las compras y cuotas correspondientes al ciclo de facturación del cliente, teniendo en cuenta su fecha de corte.

- **BC 03 — Credit Management:** mantiene los días de corte y de pago y las condiciones contractuales del cliente.
- **BC 04 — Sales Management:** proporciona los registros de compras y sus fechas para identificar las operaciones comprendidas en el período.
- **BC 05 — Financial Management:** proporciona las cuotas y sus componentes financieros calculados para el período.
- **BC 06 — Settlement & Collection Management:** determina el período aplicable, consolida los conceptos, genera y administra `MonthlySettlements` y presenta el estado de cuenta.

**Descargo de responsabilidad:** establecer el día de corte es responsabilidad de BC 03, pero **ejecutar el corte mensual y emitir la liquidación corresponde a BC 06**. Las compras posteriores al corte deben asignarse al ciclo siguiente según la regla de US-08; no corresponde que BC 03 recalcule ni almacene estados de cuenta.

### 2.6. BC 03 — Credit Management, BC 05 — Financial Management y BC 06 — Settlement & Collection Management (US-09)

La **US-09 — Módulo de Registro de Pagos, Cálculo de Mora y Comprobante** requiere cobrar la liquidación exigible, aplicar las reglas de mora y respetar el orden de imputación establecido.

- **BC 03 — Credit Management:** mantiene las tasas moratorias y compensatorias pactadas y los datos del perfil crediticio que correspondan.
- **BC 05 — Financial Management:** concentra las reglas de cálculo financiero que sean necesarias para determinar intereses y mora, sin asumir el registro del cobro.
- **BC 06 — Settlement & Collection Management:** consulta el total exigible, rechaza los pagos parciales según US-09, coordina el cálculo aplicable, aplica la prelación **mora → interés compensatorio → capital**, registra `Payments`, actualiza la liquidación y gestiona el comprobante.

**Descargo de responsabilidad:** BC 03 no cobra liquidaciones ni registra pagos. BC 05 no sustituye el proceso de recaudación de BC 06. El saldo a favor del cliente, representado en `Customers`, deberá mantenerse consistente cuando las operaciones de cobro produzcan cambios sobre él.

**Consideración para el desarrollo:** al utilizar JSON Server, la actualización coordinada de pagos, saldos, liquidaciones y perfil crediticio no cuenta todavía con garantías transaccionales de backend.

## 3. Decisiones Arquitectónicas

### 3.1. Consistencia entre venta e inventario

La confirmación de una venta y su correspondiente descuento de inventario deben mantenerse consistentes: una venta no debe quedar confirmada sin reflejar las existencias consumidas.

Esta necesidad se relaciona con la historia técnica **TS04 — Transacciones Atómicas para Inventario**.

Mientras se utilice **JSON Server** como persistencia temporal, la coordinación entre solicitudes HTTP no equivale a una transacción atómica. Por ello, el mecanismo que garantice dicha consistencia quedará definido al implementar la integración de BC 04 y la historia técnica TS04.

**Criterio de responsabilidad:** BC 02 es responsable de las existencias; BC 04 inicia y coordina su descuento como consecuencia de una venta.

### 3.2. Separación entre identidad y perfil crediticio

`Users` (BC 01) representa la identidad y el acceso; `Customers` (BC 03) representa las condiciones crediticias de un cliente dentro de una tienda. La asociación entre ambos no implica compartir la lógica de gestión de credenciales.

### 3.3. Crédito disponible como información derivada

El modelo `Customers` contiene `credit_limit`, pero no un campo independiente de `available_credit`. Por tanto, el cupo disponible debe calcularse a partir del **límite asignado y la deuda vigente correctamente consolidada**, considerando las operaciones registradas y los pagos aplicados, sin duplicar montos entre contextos. La fuente y coordinación definitivas se establecerán al implementar la verificación de US-06.

### 3.4. Precisión financiera y separación de cálculos

US-05 requiere registrar tasas con **hasta siete decimales**. BC 03 conserva esos parámetros; BC 05 realiza los cálculos de cuotas e intereses previstos por US-07 y los cálculos financieros que se reutilicen en US-09. Se evitará redondear prematuramente los valores. La persistencia y precisión definitivas deben verificarse cuando se integre el backend real.

### 3.5. Coordinación de operaciones entre contextos

Las operaciones de confirmación de ventas (US-06), emisión de liquidaciones (US-08) y cobro (US-09) requieren información de distintos Bounded Contexts. **La coordinación de cada operación corresponde al contexto propietario del proceso**, mientras que los otros proporcionan sus datos y capacidades específicas.

Estas notas expresan el **diseño conceptual acordado**, no integraciones ya implementadas ni garantías de atomicidad proporcionadas por JSON Server.
