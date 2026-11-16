## US-01: Registro y Gestión de Tienda
**Epic:** E01  
**ID:** US-01

### Description
***Como*** Administrador del Sistema, ***quiero*** registrar y administrar la información de los comercios en la plataforma, ***para*** habilitar la operación independiente de múltiples tiendas en un entorno multitenant.

### Scenario 01
* **DADO** que el Administrador de la Tienda ingresa al panel de gestión e introduce los datos del comercio (RUC/ID, nombre, dirección y teléfono),
* **CUANDO** presiona el botón "Guardar Tienda",
* **ENTONCES** la tienda se registra activamente en el sistema con un espacio de datos aislado.

### Scenario 02
* **DADO** que una tienda cambia su estado a "Inactiva",
* **CUANDO** un usuario perteneciente a dicho comercio intenta autenticarse,
* **ENTONCES** el sistema bloquea el acceso mostrando un mensaje de cuenta suspendida.

---

## US-02: Pantalla de Autenticación y Control de Acceso por Rol
**Epic:** E01  
**ID:** US-02

### Description
***Como*** Usuario del Sistema (Cliente, Admin de Tienda o SuperAdmin), ***quiero*** iniciar sesión con mis credenciales de usuario y contraseña, ***para*** ingresar de forma segura y acceder únicamente a las funcionalidades asignadas a mi rol.

### Scenario 01
* **DADO** que el usuario ingresa sus credenciales en el formulario de login,
* **CUANDO** los datos coinciden con un registro activo en la base de datos,
* **ENTONCES** el sistema otorga acceso y despliega el menú con las opciones exclusivas de su rol.

### Scenario 02
* **DADO** que el usuario ingresa una contraseña o usuario incorrecto,
* **CUANDO** envía el formulario de autenticación,
* **ENTONCES** la interfaz muestra una alerta de error genérica sin revelar cuál dato fue incorrecto.
