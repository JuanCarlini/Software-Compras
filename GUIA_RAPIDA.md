# Guía Rápida de Uso

## Inicio de Sesión

1. Abra su navegador y vaya a la dirección del sistema (por defecto: http://localhost:3000)
2. Ingrese su correo electrónico y contraseña
3. Haga clic en "Ingresar"

## Panel de Control

El panel de control muestra:
- Estadísticas generales de órdenes
- Órdenes pendientes de aprobación (para aprobadores y admin)
- Estado de las cajas (para admin)
- Últimas órdenes de compra
- Últimos pagos realizados
- Accesos rápidos a funciones comunes

## Gestión de Órdenes de Compra

### Crear una nueva orden de compra

1. Vaya a **Órdenes de Compra > Nueva Orden**
2. Complete los datos básicos:
   - Seleccione un proveedor
   - Escriba el título/tarea
   - Seleccione moneda (peso o dólar)
   - Elija forma de pago (contado o cuotas)
   - Si eligió cuotas, indique la cantidad
   - Establezca fecha de entrega
   - Agregue observaciones si es necesario
3. Haga clic en **Guardar**
4. El sistema le asignará un número de orden (formato OC-XXX) y quedará en estado "borrador"

### Agregar líneas a una orden de compra

1. Después de crear la orden, será redirigido a la pantalla de líneas
2. Haga clic en **Agregar Línea**
3. Complete los datos de la línea:
   - Seleccione el tipo (item o servicio)
   - Ingrese un título
   - Seleccione la unidad (unidad, tonelada, kg, m2, etc.)
   - Ingrese cantidad y precio unitario
   - Indique el porcentaje de IVA
   - Agregue observaciones si es necesario
4. Haga clic en **Guardar Línea**
5. Repita el proceso para agregar más líneas

### Enviar una orden a aprobación

1. Una vez agregadas todas las líneas, haga clic en **Enviar a Aprobación**
2. La orden cambiará su estado a "esperando aprobación"
3. Los usuarios con rol aprobador serán notificados

### Aprobar una orden de compra

1. Inicie sesión con un usuario que tenga rol de aprobador
2. Vaya a **Órdenes de Compra > Pendientes de Aprobación**
3. Revise los detalles de la orden haciendo clic en **Ver**
4. Para aprobar, haga clic en **Aprobar Orden**
5. Para rechazar, haga clic en **Rechazar** e indique el motivo

## Gestión de Órdenes de Pago

### Crear una nueva orden de pago

1. Vaya a **Órdenes de Pago > Nuevo Pago**
2. Seleccione un proveedor
3. Seleccione la orden de compra aprobada que desea pagar
4. Seleccione la caja de donde saldrá el dinero
5. Ingrese el monto a pagar
6. Haga clic en **Guardar**
7. El sistema cambiará el estado de la orden de pago según el porcentaje pagado:
   - Parcial: si no se pagó el 100%
   - Total: si se pagó el 100%

### Anular una orden de pago

1. Vaya a **Órdenes de Pago**
2. Busque la orden que desea anular
3. Haga clic en **Ver**
4. Haga clic en **Anular Pago**
5. Confirme la anulación

## Reportes

### Reporte de órdenes pendientes de pago

1. Vaya a **Órdenes de Compra > Reporte de Pendientes**
2. Visualice todas las órdenes aprobadas que están pendientes de pago o con pago parcial

### Reporte de pagos

1. Vaya a **Órdenes de Pago > Reporte de Pagos**
2. Filtre por fecha, proveedor o caja según necesite
3. Visualice los totales por moneda al final del reporte

## Administración (Solo para administradores)

### Gestión de Usuarios

1. Vaya a **Administración > Usuarios**
2. Para crear un nuevo usuario, haga clic en **Nuevo Usuario**
3. Para editar un usuario existente, haga clic en **Editar**
4. Para asignar roles especiales:
   - Seleccione el rol adecuado (admin, usuario, aprobador, anulador)
   - Si es aprobador, establezca el límite de aprobación
5. Para desactivar un usuario, cambie el interruptor de Activo

### Gestión de Proveedores

1. Vaya a **Administración > Proveedores**
2. Para crear un nuevo proveedor, haga clic en **Nuevo Proveedor**
3. Para editar un proveedor existente, haga clic en **Editar**
4. Para desactivar un proveedor, cambie el interruptor de Activo

### Gestión de Cajas

1. Vaya a **Administración > Cajas**
2. Para crear una nueva caja, haga clic en **Nueva Caja**
3. Para editar una caja existente, haga clic en **Editar**
4. Para ver el historial de movimientos, haga clic en **Historial**
5. Para ajustar el saldo, haga clic en **Ajustar Saldo**

## Otras Funciones

### Cambiar Contraseña

1. Haga clic en su nombre de usuario en la esquina superior derecha
2. Seleccione **Cambiar Contraseña**
3. Ingrese su contraseña actual
4. Ingrese y confirme su nueva contraseña
5. Haga clic en **Cambiar Contraseña**

### Cerrar Sesión

1. Haga clic en su nombre de usuario en la esquina superior derecha
2. Seleccione **Cerrar Sesión**

## Notas Importantes

- Las órdenes en estado "borrador" pueden ser editadas libremente
- Una vez enviada a aprobación, no se puede modificar la orden
- Solo los usuarios con rol aprobador y con límite suficiente pueden aprobar órdenes
- Las órdenes rechazadas no pueden ser pagadas
- El administrador puede ver y gestionar todas las órdenes del sistema
- Los usuarios normales solo pueden ver y gestionar sus propias órdenes
- Ningún registro se elimina físicamente del sistema, solo se desactiva