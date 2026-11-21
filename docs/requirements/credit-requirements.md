## US-05: Formulario de Ficha Crediticia del Cliente
**Epic:** E03  
**ID:** US-05

### Description
***Como*** Administrador de Tienda, ***quiero*** registrar a los clientes y configurar sus parámetros crediticios personalizados, ***para*** definir sus límites de compra y condiciones de financiación.

### Scenario 01
* **DADO** que el Administrador registra un cliente configurando límite de crédito, días de corte/pago, moneda y tasas (compensatoria y moratoria),
* **CUANDO** guarda la información del perfil crediticio,
* **ENTONCES** el cliente queda habilitado para realizar compras a crédito dentro de los parámetros asignados.

### Scenario 02
* **DADO** que se ingresan valores de tasa de interés (nominal o efectiva),
* **CUANDO** el usuario especifica los decimales de precisión,
* **ENTONCES** el formulario permite el almacenamiento preciso de la tasa con hasta 7 decimales.

---

## US-06: Pantalla de Registro de Ventas y Verificador de Crédito
**Epic:** E03  
**ID:** US-06

### Description
***Como*** Cliente o Administrador, ***quiero*** consultar la línea de crédito disponible durante el proceso de compra, ***para*** garantizar que el monto total no sobrepase el cupo máximo asignado.

### Scenario 01
* **DADO** que un cliente selecciona productos para una compra al crédito,
* **CUANDO** la suma de su deuda activa más la nueva compra excede su limite_credito,
* **ENTONCES** la interfaz deshabilita el botón de confirmación de venta y muestra un aviso de cupo insuficiente.

### Scenario 02
* **DADO** que la compra está dentro del límite crediticio disponible,
* **CUANDO** se confirma la transacción,
* **ENTONCES** la venta se registra con éxito y el crédito disponible del cliente se actualiza dinámicamente.

---

## US-07: Generación Visual del Plan de Cuotas
**Epic:** E03  
**ID:** US-07

### Description
***Como*** Cliente o Administrador, ***quiero*** previsualizar el cronograma de amortización antes de confirmar una compra diferida en meses, ***para*** revisar los montos de las cuotas fijas, desglose de capital, intereses y días de gracia.

### Scenario 01
* **DADO** que se simula o procesa una compra financiada en meses realizada antes de la fecha de corte,
* **CUANDO** el sistema genera la tabla de cuotas bajo el Método Francés (base 360/30),
* **ENTONCES** la pantalla calcula la capitalización por los días de gracia total transcurridos antes de presentar el valor de la cuota constante mensual.

### Scenario 02
* **DADO** que el cliente consulta la previsualización del plan de cuotas,
* **CUANDO** carga la tabla,
* **ENTONCES** visualiza explícitamente el detalle por cuota: número, fecha de vencimiento, saldo inicial, capital, interés, cuota fija y saldo final.

---

## US-08: Vista de Estado de Cuenta y Liquidación Mensual
**Epic:** E04  
**ID:** US-08

### Description
***Como*** Cliente, ***quiero*** consultar mi estado de cuenta al llegar la fecha de corte mensual, ***para*** conocer las compras realizadas, cuotas del periodo y el monto total a cancelar en mi fecha límite de pago.

### Scenario 01
* **DADO** que llega el día de corte mensual (fecha_corte_dia) configurado para el cliente,
* **CUANDO** el sistema consolida el estado de cuenta,
* **ENTONCES** la pantalla agrupa las compras a fin de mes anteriores al corte e incluye las cuotas correspondientes del periodo con sus intereses acumulados.

### Scenario 02
* **DADO** que una compra a fin de mes se efectúa después de la hora/fecha de corte,
* **CUANDO** se emite la liquidación del ciclo actual,
* **ENTONCES** la transacción se excluye del periodo presente y se traslada automáticamente a la liquidación del mes posterior.

---

## US-09: Módulo de Registro de Pagos, Cálculo de Mora y Comprobante
**Epic:** E04  
**ID:** US-09

### Description
***Como*** Administrador de Tienda, ***quiero*** procesar el cobro de la liquidación calculando moras y aplicando el orden de prelación, ***para*** cancelar la deuda del cliente y emitir el comprobante correspondiente.

### Scenario 01
* **DADO** que un cliente acude a realizar el pago de su liquidación mensual,
* **CUANDO** el operador intenta ingresar un monto menor al total adeudado,
* **ENTONCES** la interfaz rechaza el registro emitiendo una alerta de prohibición de pagos parciales.

### Scenario 02
* **DADO** que el pago se realiza posterior a la fecha límite pactada,
* **CUANDO** se procesa la transacción de cobro,
* **ENTONCES** el sistema calcula los días de mora, aplica la tasa moratoria pactada e imputa el dinero en el orden estricto de prelación: 1° Mora → 2° Interés Compensatorio → 3° Capital.
