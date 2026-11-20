## US-03: Catálogo Visual de Productos y Gestión Comercial
**Epic:** E02  
**ID:** US-03

### Description
***Como*** Administrador de Tienda, ***quiero*** registrar y administrar los productos o servicios con sus precios (contado/crédito), imágenes y modalidades de venta, ***para*** publicar la oferta comercial del comercio.

### Scenario 01
* **DADO** que el Administrador de Tienda llena la ficha del producto con imagen, precios y modalidades aceptadas (fin de mes/meses),
* **CUANDO** confirma el registro,
* **ENTONCES** el producto se visualiza en el catálogo interactivo de la tienda.

### Scenario 02
* **DADO** que un producto registrado cuenta con transacciones históricas asociadas,
* **CUANDO** el Administrador decide eliminarlo,
* **ENTONCES** el sistema realiza un borrado lógico ocultándose del catálogo activo sin eliminar sus registros históricos.

---

## US-04: Monitor de Stock y Alertas Visuales de Inventario
**Epic:** E02  
**ID:** US-04

### Description
***Como*** Administrador de Tienda, ***quiero*** consultar el conteo de existencias y recibir alertas de bajo stock, ***para*** reponer productos oportunamente y evitar vender ítems agotados.

### Scenario 01
* **DADO** que se concreta una venta de productos al contado o a crédito,
* **CUANDO** la transacción es confirmada por el sistema,
* **ENTONCES** el contador de existencias (stock_actual) del producto se reduce automáticamente.

### Scenario 02
* **DADO** que el stock de un producto alcanza o cae por debajo del stock_minimo configurado,
* **CUANDO** el Administrador visualiza el inventario o la pantalla de ventas,
* **ENTONCES** la interfaz resalta el producto con una insignia roja indicando estado crítico de desabastecimiento.
