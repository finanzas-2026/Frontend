# Decisión arquitectónica: constantes por Bounded Context

**Proyecto:** Crédito Proximidad  
**Destinatarios:** Equipos de Front End y Back End  
**Estado:** Acuerdo de diseño para el proyecto universitario  
**Alcance:** Catálogos estáticos de IAM, Catalog y Credit Management

## 1. Objetivo

Documentar la distribución de las constantes implementadas en el frontend, justificar su uso dentro de las restricciones de tiempo del proyecto y delimitar las responsabilidades que debe asumir el backend al recibir, validar, persistir y utilizar los valores seleccionados.

La decisión busca **evitar tablas, endpoints de mantenimiento y relaciones innecesarias para catálogos pequeños y cerrados**, sin trasladar la autoridad sobre las reglas de negocio al frontend. No se pretende sustituir la persistencia de los datos del cliente, usuario o producto.

## 2. Clasificación por Bounded Context

| Bounded Context | Archivo de constantes | Valores definidos | Atributos relacionados |
|---|---|---|---|
| **BC 01 — IAM & Tenant Management** | `user-roles.constant.ts` (`UserRoles`) | `SUPER_ADMIN`, `STORE_ADMIN`, `CUSTOMER` | `Users.user_type` |
| **BC 02 — Catalog & Inventory Management** | `product-status.constant.ts` (`ProductStatuses`) | `ACTIVE`, `INACTIVE` | `Products.status` |
| **BC 03 — Credit Management** | `interest-rate-type.constant.ts` (`InterestRateTypes`) | `NOMINAL`, `EFECTIVA` | `Customers.compensatory_rate_type`, `Customers.penalty_rate_type` |
| **BC 03 — Credit Management** | `interest-rate-period.constant.ts` (`InterestRatePeriods`) | `1`, `7`, `15`, `30`, `60`, `90`, `180`, `360` días | `Customers.compensatory_rate_period_days`, `Customers.compensatory_capitalization_days`, `Customers.penalty_rate_period_days`, `Customers.penalty_capitalization_days` |
| **BC 03 — Credit Management** | `credit-currency.constant.ts` (`CreditCurrencies`) | `PEN`, `USD`, `EUR` | `Customers.credit_currency` |

### BC 01 — IAM: roles de usuario

`UserRoles` define los tres roles de acceso. En Front End permite construir interfaces y navegación coherentes con la sesión. **En Back End**, los mismos valores deben ser reconocidos para validar `Users.user_type` y **autorizar cada operación**. Ocultar una pantalla con un guard de Angular no protege por sí solo un endpoint.

### BC 02 — Catalog: estado de producto

`ProductStatuses` define `ACTIVE` e `INACTIVE`. En Front End sirve para representar el estado del producto y filtrar su visualización. En Back End se valida y persiste `Products.status`; `INACTIVE` representa una **baja lógica**, conservando el registro y sus referencias históricas. La regla que impida operar indebidamente con un producto inactivo no debe depender únicamente de la interfaz.

### BC 03 — Credit: condiciones financieras

- `InterestRateTypes` distingue la **modalidad nominal o efectiva**; no identifica por sí sola el período de la tasa.
- `InterestRatePeriods` codifica ocho períodos comerciales: **diario (1), semanal (7), quincenal (15), mensual (30), bimestral (60), trimestral (90), semestral (180) y anual (360)**. Los mismos valores se usan para **dos propiedades independientes**: período de referencia de la tasa y frecuencia de capitalización nominal.
- `CreditCurrencies` admite **PEN, USD y EUR**, con **PEN** como moneda predeterminada. Esta selección no implica que se haya implementado conversión de divisas.

Ejemplo de condición pactada: **TNA de 24 % con capitalización mensual**:

```json
{
  "compensatory_rate_type": "NOMINAL",
  "compensatory_rate_period_days": 360,
  "compensatory_capitalization_days": 30,
  "compensatory_rate_value": 0.24
}
```

En este ejemplo, **360** expresa el período de referencia anual y **30** la capitalización mensual; no deben igualarse automáticamente. Los valores corresponden a una parte del registro `Customers`, no a un recurso completo.

## 3. Por qué es defendible usar constantes en este proyecto

### 3.1. Reducción de complejidad sin perder expresividad

Los conjuntos descritos son **pequeños, conocidos y relativamente estables**. Para representarlos no se necesitan necesariamente entidades independientes, tablas de catálogo ni endpoints CRUD de administración. Guardar los códigos directamente en las entidades que los utilizan es una alternativa válida, siempre que sus restricciones sean claras.

**Precisión de modelado:** estos catálogos no requieren por naturaleza relaciones muchos a muchos; evitar tablas auxiliares puede simplificar el modelo, pero no significa que una tabla de catálogo hubiera exigido obligatoriamente una relación muchos a muchos.

### 3.2. Menor carga de coordinación entre equipos

Al fijar las opciones de selección en Front End, se evita desarrollar y mantener endpoints cuyo único propósito sería consultar listados invariables. Esto reduce tareas de interfaz, infraestructura y coordinación con el equipo Back End y permite concentrar el esfuerzo disponible en los procesos principales del trabajo: registro de clientes, ventas, cálculos financieros y cobranzas.

### 3.3. Decisión proporcional al alcance universitario

La finalidad es cumplir los requisitos académicos dentro del tiempo disponible, **no construir un sistema de catálogos configurable por administradores**. Esta elección resulta razonable mientras los valores sean cerrados y no exista un requisito de administrarlos dinámicamente. En un producto empresarial con catálogos frecuentemente cambiantes, la decisión podría revisarse.

### 3.4. Compatibilidad con DDD y separación por contextos

Cada Bounded Context mantiene sus conceptos: IAM administra roles, Catalog estados de productos y Credit condiciones crediticias. Las constantes en Domain expresan vocabularios del contexto; no constituyen por sí mismas algoritmos de negocio ni reemplazan las validaciones del servidor.

## 4. Distinción fundamental: constantes frente a persistencia

**Las constantes de TypeScript no son registros persistidos.** Son definiciones de valores admitidos dentro del código del frontend.

Hay dos cosas distintas:

1. **Catálogo de opciones:** `NOMINAL`, `EFECTIVA`, `PEN`, `ACTIVE`, etc. Puede definirse mediante constantes o enumeraciones en cada aplicación, **sin una tabla propia** en base de datos.
2. **Valor seleccionado en una entidad:** `Users.user_type`, `Products.status` y los campos financieros de `Customers`. **Sí debe persistirse** para poder recuperar la configuración y operar correctamente.

Por ello, no es exacto afirmar que los parámetros «ya están persistidos en Front End» o que el backend solo debe conocerlos sin almacenar nada. El frontend **define opciones y envía selecciones**; el backend **valida y persiste la selección efectiva en la entidad correspondiente**, además de usarla para aplicar las reglas de negocio. No necesita persistir una *tabla de catálogo* si no aporta valor.

## 5. Recomendaciones y responsabilidades para Back End

| Contexto | Contrato mínimo del backend | Responsabilidad obligatoria |
|---|---|---|
| **IAM** | Reconocer `SUPER_ADMIN`, `STORE_ADMIN`, `CUSTOMER` | Validar `Users.user_type` y aplicar autorización real del lado del servidor |
| **Catalog** | Reconocer `ACTIVE`, `INACTIVE` | Validar y persistir el estado; mantener la semántica de baja lógica y las referencias históricas |
| **Credit — modalidad** | Reconocer `NOMINAL`, `EFECTIVA` | Validar modalidad y exigir reglas de capitalización según el tipo |
| **Credit — períodos** | Reconocer `1`, `7`, `15`, `30`, `60`, `90`, `180`, `360` | Validar los días permitidos, distinguiendo referencia y capitalización |
| **Credit — monedas** | Reconocer `PEN`, `USD`, `EUR` | Validar y persistir la moneda; no asumir conversiones automáticas |

### Reglas específicas para Credit

- **Tasa nominal:** requiere un período de referencia y una frecuencia de capitalización explícita, que pueden ser diferentes.
- **Tasa efectiva:** requiere un período de referencia; el campo de capitalización nominal debe ser `null`.
- **Tasa pactada:** debe conservarse tal como se registró, incluido su período; no reemplazar permanentemente una TEM por una TEA calculada.
- **Cálculos financieros:** las conversiones y normalizaciones se ejecutan donde corresponda a las reglas financieras (BC 05), no como efecto secundario de persistir un cliente en BC 03.
- **Precisión:** respetar el contrato decimal de las tasas y la base comercial de **360 días y meses de 30 días**. La periodicidad semanal de **7 días** requiere una convención explícita, porque 360 no es divisible exactamente entre 7.
- **Compatibilidad contractual:** la API debe validar lo recibido aunque el formulario Angular ya haya aplicado las mismas restricciones. Una petición externa puede omitir la interfaz.
- **Aislamiento de tienda:** comprobar en el servidor que cada operación actúe sobre datos de la tienda autorizada.

### Qué no se exige al Back End por usar estas constantes

- Crear tablas independientes `UserRoles`, `ProductStatuses`, `InterestRateTypes`, `InterestRatePeriods` o `CreditCurrencies` solo para servir listados fijos.
- Crear endpoints CRUD para administrar esos listados, salvo que aparezca un requisito específico.
- Reutilizar el código TypeScript del frontend. Puede expresar las mismas reglas mediante enumeraciones, validadores, restricciones `CHECK` o tipos propios del stack del backend.

**Sí es indispensable** que los valores admitidos, los nombres del contrato HTTP, las restricciones de la base de datos y las reglas implementadas por Back End sean coherentes entre sí.

## 6. Costos y limitaciones aceptados

1. **Sin administración dinámica:** incorporar una nueva opción exige actualizar el código y posiblemente las restricciones del servidor y la base de datos.
2. **Sin fuente única ejecutable entre aplicaciones:** Front End y Back End deben coordinar versiones de sus valores; este documento funciona como referencia de contrato, no como sincronización automática.
3. **El frontend no constituye una frontera de seguridad:** los controles de formulario mejoran la experiencia, pero no garantizan integridad ni autorización.
4. **Los campos financieros deben seguir existiendo en `Customers`:** almacenar las condiciones de cada cliente continúa siendo necesario; la ausencia de tablas de catálogo no elimina esos atributos.
5. **La validación y el cálculo financiero permanecen en el backend correspondiente:** esta simplificación no reduce la necesidad de verificar las combinaciones de tasas ni de calcular correctamente el cronograma, interés o mora.

## 7. Acuerdo propuesto entre equipos

Se mantendrán **cinco archivos de constantes repartidos entre tres Bounded Contexts** como definición de catálogos estáticos en Front End. El Back End implementará un conjunto equivalente de valores permitidos y validaciones, sin necesidad de crear entidades persistentes para los catálogos. Los valores realmente seleccionados seguirán almacenándose en `Users`, `Products` y `Customers`, según su responsabilidad.

**Criterio de aceptación:** la simplificación de la estructura relacional no debe comprometer la integridad de los datos, la autorización ni la corrección de los cálculos financieros. De esta manera se reduce trabajo de infraestructura de catálogos sin desplazar la responsabilidad de las reglas de negocio fuera de Back End.

---

**Fuentes utilizadas:** `user-roles.constant.ts`, `product-status.constant.ts`, `interest-rate-type.constant.ts`, `interest-rate-period.constant.ts` y `credit-currency.constant.ts` suministrados por el equipo de Front End. Las consideraciones de arquitectura y responsabilidades del servidor son el análisis técnico asociado a esas definiciones.
