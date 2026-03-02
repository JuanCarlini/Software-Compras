# Gestión Uno

## Sistema de Control de Compras y Pagos

---

## Introducción General

**Gestión Uno** es un sistema integral de gestión administrativa diseñado para empresas que requieren un control riguroso y trazable de sus procesos de compras y pagos a proveedores.

El sistema resuelve un problema crítico que enfrentan especialmente las empresas constructoras, desarrolladoras inmobiliarias y organizaciones con múltiples proyectos simultáneos: **la falta de control, orden y trazabilidad** en el circuito completo que va desde la solicitud de un bien o servicio hasta el pago efectivo al proveedor.

Gestión Uno está pensado para organizaciones que:
- Manejan múltiples proveedores y proyectos en paralelo
- Necesitan aprobar formalmente cada etapa del proceso antes de avanzar
- Requieren saber en todo momento qué se ordenó, qué se recibió, qué se facturó y qué se pagó
- Buscan eliminar pagos no autorizados, duplicaciones y errores administrativos
- Deben cumplir con procesos de auditoría y control interno

---

## Alcance del Sistema

### Qué cubre Gestión Uno

El sistema gestiona integralmente el ciclo de vida de una compra, desde su solicitud hasta su pago:

1. **Órdenes de Compra**: Autorización formal para adquirir bienes o servicios a un proveedor
2. **Certificaciones**: Confirmación de que lo solicitado fue efectivamente recibido o ejecutado
3. **Facturas**: Registro de la facturación del proveedor por lo ejecutado
4. **Órdenes de Pago**: Autorización y ejecución de pagos a proveedores
5. **Gestión de Proveedores**: Base de datos de proveedores activos e inactivos
6. **Gestión de Proyectos**: Agrupación de compras por proyecto para seguimiento y control
7. **Catálogo de Items**: Productos y servicios reutilizables para agilizar la carga de órdenes

### Límites del alcance

Gestión Uno **NO es**:
- Un sistema contable completo (no maneja plan de cuentas, asientos contables ni balances)
- Un sistema de gestión de inventarios (no controla stock en almacenes)
- Un sistema de recursos humanos (no gestiona sueldos ni liquidaciones)
- Una plataforma de facturación electrónica (registra facturas recibidas, no emite facturas propias)

El enfoque está exclusivamente en **controlar el flujo de documentos administrativos** desde la solicitud de compra hasta el pago al proveedor.

---

## Conceptos Clave del Negocio

### Orden de Compra (OC)

Es la **solicitud formal y autorizada** de compra de bienes o servicios a un proveedor específico.

**Información que contiene:**
- Proveedor al que se le ordena
- Proyecto al que se imputa (opcional)
- Fecha de la orden
- Moneda (pesos argentinos, dólares o euros)
- Detalle línea por línea de lo que se solicita
- Cantidades, precios unitarios y totales
- Observaciones adicionales

**Propósito:** Formalizar y autorizar una compra antes de que el proveedor ejecute el trabajo o entregue los productos.

**Lógica:** Solo las órdenes aprobadas por un supervisor pueden continuar su flujo en el sistema.

---

### Línea de Orden de Compra

Cada orden de compra se compone de **líneas individuales**, donde cada línea representa un producto o servicio específico.

**Información que contiene cada línea:**
- Descripción del producto o servicio
- Cantidad solicitada
- Unidad de medida (metros, litros, kilogramos, unidades, horas, etc.)
- Precio unitario neto
- Porcentaje de IVA aplicable (generalmente 21%, pero puede ser 0%, 10.5% u otro)
- Total neto y total con IVA

**Vinculación con catálogo:** Opcionalmente, cada línea puede estar vinculada a un ítem del catálogo, lo que permite reutilizar descripciones y precios previamente cargados.

---

### Certificación

Es el **documento de validación** que confirma que el proveedor cumplió con lo solicitado: entregó los productos o ejecutó los servicios según lo acordado.

**Información que contiene:**
- Proyecto al que pertenece (obligatorio)
- Proveedor que hizo la entrega o ejecución
- Fecha de certificación
- Detalle línea por línea de lo certificado
- Cantidades recibidas, precios y totales
- Observaciones

**Propósito:** Establecer un punto de control donde se verifica que **lo que se ordenó efectivamente se recibió**.

**Lógica:** La certificación debe estar aprobada por un supervisor antes de que pueda vincularse a una factura. Esto evita que se facturen cosas que no fueron recibidas o ejecutadas.

---

### Facturación

Es el **registro de la factura emitida por el proveedor** por los bienes entregados o servicios prestados.

**Información que contiene:**
- Proveedor que emite la factura
- Fecha de facturación
- Detalle línea por línea de lo facturado
- Cantidades, precios y totales
- Vinculación con una o más certificaciones aprobadas

**Propósito:** Registrar formalmente lo que el proveedor está cobrando.

**Lógica clave:** Una factura **solo puede aprobarse si está vinculada a certificaciones previamente aprobadas**. Esto garantiza que no se aprueben pagos por servicios no recibidos o no validados.

---

### Orden de Pago

Es la **autorización formal para realizar un pago** a un proveedor por una o más facturas aprobadas.

**Información que contiene:**
- Proveedor que recibirá el pago
- Fecha de la orden
- Facturas que se están pagando
- Monto asignado a cada factura
- Forma de pago (transferencia bancaria, cheque, efectivo o retención)
- Total a pagar

**Propósito:** Controlar formalmente qué se paga, a quién, cuándo y por qué motivo.

**Lógica clave:** Una orden de pago debe ser aprobada por un supervisor antes de poder marcarla como efectivamente pagada.

---

### Proveedor

Es toda persona física o jurídica que **provee bienes o servicios** a la organización.

**Información que contiene:**
- Nombre o razón social
- CUIT (Clave Única de Identificación Tributaria)
- Dirección, teléfono, correo electrónico
- Estado: activo o inactivo

**Lógica:** Un proveedor suspendido (inactivo) **no puede recibir nuevas órdenes de compra**, aunque las órdenes históricas se conservan.

---

### Proyecto

Es una **agrupación lógica** para organizar compras y certificaciones según proyectos de obra, áreas de negocio o centros de costo.

**Información que contiene:**
- Nombre del proyecto
- Código único
- Descripción
- Fechas de inicio y fin
- Estado: planificado, en ejecución, finalizado o cancelado

**Propósito:** Facilitar el seguimiento de cuánto se ordenó, certificó y pagó para cada proyecto específico.

---

### Usuario

Son las personas que operan el sistema.

**Información que contiene:**
- Nombre completo
- Correo electrónico (usado para ingresar al sistema)
- Contraseña
- Rol asignado

---

### Roles y Permisos

El sistema define cuatro roles con niveles progresivos de acceso:

#### 1. Administrador
- **Permisos:** Acceso total al sistema
- **Puede:** Crear, aprobar, rechazar, anular documentos; gestionar usuarios; activar o suspender proveedores
- **Uso típico:** Gerencia, directores o personal con máxima autoridad

#### 2. Supervisor
- **Permisos:** Supervisión y aprobación de documentos
- **Puede:** Crear, aprobar, rechazar y anular documentos; suspender proveedores
- **No puede:** Gestionar usuarios ni configuraciones avanzadas
- **Uso típico:** Jefes de área, responsables de administración

#### 3. Usuario
- **Permisos:** Operación estándar del sistema
- **Puede:** Crear órdenes de compra, certificaciones, facturas y órdenes de pago (en estado borrador); ver toda la información
- **No puede:** Aprobar, rechazar ni anular documentos; suspender proveedores
- **Uso típico:** Personal administrativo, encargados de compras

#### 4. Solo Lectura
- **Permisos:** Consulta únicamente
- **Puede:** Ver todos los documentos del sistema
- **No puede:** Crear, modificar, aprobar ni rechazar nada
- **Uso típico:** Consultores externos, auditores, personal que necesita información pero no debe operar

---

## Flujo Operativo Completo

### De la Orden de Compra al Pago: Proceso Paso a Paso

El sistema implementa un **flujo lineal obligatorio** que garantiza control y trazabilidad en cada etapa.

---

### Etapa 1: Creación y Aprobación de la Orden de Compra

**Paso 1:** Un usuario necesita adquirir un bien o servicio.

**Paso 2:** Ingresa al sistema y crea una **Orden de Compra** en estado **borrador**.

**Qué carga:**
- Selecciona el proveedor (debe estar activo)
- Opcionalmente selecciona el proyecto al que se imputa
- Define la moneda (pesos, dólares o euros)
- Carga las líneas de detalle:
  - Puede usar ítems del catálogo (descripción y precio ya cargados) o cargar manualmente
  - Especifica cantidad, precio unitario, porcentaje de IVA
- Agrega observaciones si es necesario

**Paso 3:** El usuario revisa la orden completa. Los totales se calculan automáticamente.

**Paso 4:** El usuario envía la orden para aprobación (cambia de estado **borrador** a **en aprobación**).

**Paso 5:** Un supervisor o administrador revisa la orden:
- **Si aprueba:** La orden pasa a estado **aprobado** y queda lista para ejecución
- **Si rechaza:** La orden pasa a estado **rechazado** y el usuario debe crear una nueva orden corregida

**Resultado:** Una orden de compra aprobada es la autorización formal para que el proveedor ejecute el trabajo o entregue los productos.

---

### Etapa 2: Certificación de Recepción o Ejecución

**Paso 6:** El proveedor ejecuta el trabajo o entrega los productos.

**Paso 7:** El usuario verifica que lo recibido corresponde a lo ordenado.

**Paso 8:** El usuario crea una **Certificación** en estado **borrador**.

**Qué carga:**
- Selecciona el proyecto (obligatorio)
- Selecciona el proveedor que hizo la entrega
- Carga las líneas de detalle:
  - Qué se recibió exactamente
  - Cantidades recibidas
  - Precios acordados
- Agrega observaciones (por ejemplo, si hubo diferencias con lo ordenado)

**Paso 9:** Un supervisor o administrador revisa la certificación:
- Valida que lo certificado corresponde efectivamente a lo recibido
- Verifica que los montos sean correctos
- **Si aprueba:** La certificación pasa a estado **aprobado**
- **Si rechaza:** La certificación pasa a estado **rechazado** y el usuario debe crear una nueva

**Resultado:** Una certificación aprobada es la confirmación formal de que el proveedor cumplió con lo acordado.

**Regla crítica:** Solo las certificaciones aprobadas pueden vincularse posteriormente a facturas.

---

### Etapa 3: Registro y Aprobación de Factura

**Paso 10:** El proveedor emite su factura por lo entregado o ejecutado.

**Paso 11:** El usuario recibe la factura y la carga en el sistema, creando una **Factura** en estado **borrador**.

**Qué carga:**
- Selecciona el proveedor que emitió la factura
- **Vincula una o más certificaciones aprobadas** (esto es obligatorio)
  - El sistema permite vincular varias certificaciones a una sola factura
  - Todas las certificaciones deben ser del mismo proveedor
- Carga las líneas de detalle de la factura:
  - Generalmente coinciden con lo certificado
  - Especifica cantidades, precios, IVA y totales

**Paso 12:** El usuario o supervisor revisa la factura:
- Verifica que no haya duplicaciones
- Controla que los montos coincidan con las certificaciones vinculadas
- Verifica que la factura no haya sido cargada previamente

**Paso 13:** Un supervisor o administrador decide:
- **Si aprueba:** La factura pasa a estado **aprobado** y queda lista para pago
- **Si rechaza:** La factura pasa a estado **rechazado** y debe corregirse

**Resultado:** Una factura aprobada es el documento que habilita formalmente el pago al proveedor.

**Regla crítica:** Solo las facturas aprobadas pueden incluirse en órdenes de pago.

---

### Etapa 4: Creación y Ejecución de Orden de Pago

**Paso 14:** El usuario decide realizar un pago a un proveedor.

**Paso 15:** El usuario crea una **Orden de Pago** en estado **pendiente**.

**Qué carga:**
- Selecciona el proveedor que recibirá el pago
- Selecciona una o más facturas aprobadas del proveedor
- Define cuánto se paga de cada factura (puede ser pago parcial o total)
- Especifica la forma de pago para cada línea:
  - Transferencia bancaria
  - Cheque
  - Efectivo
  - Retención (descuento por obligaciones legales)
- Agrega observaciones (por ejemplo, número de cheque, fecha de transferencia, etc.)

**Paso 16:** El usuario revisa que los montos sean correctos.

**Paso 17:** Un supervisor o administrador revisa la orden de pago:
- Verifica que las facturas estén aprobadas
- Controla que los montos sean correctos
- Valida que haya fondos disponibles (control manual, no automático del sistema)
- **Si aprueba:** La orden de pago pasa a estado **aprobado**
- **Si rechaza:** La orden de pago pasa a estado **rechazado** y debe corregirse

**Paso 18:** Una vez aprobada, el supervisor o administrador ejecuta efectivamente el pago (realiza la transferencia, emite el cheque, entrega el efectivo).

**Paso 19:** Una vez confirmado que el pago se realizó, marca la orden de pago como **pagada**.

**Resultado:** El ciclo completo se ha cerrado. Se ordenó, se recibió, se facturó y se pagó, con aprobaciones formales en cada etapa.

---

### Diagrama del Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

   USUARIO CREA                 SUPERVISOR APRUEBA
       │                               │
       ↓                               ↓
   OC BORRADOR  ──────────────→  OC APROBADA
                                       │
                                       ↓
                              (Proveedor ejecuta)
                                       │
       ↓                               ↓
   CERT BORRADOR ──────────────→ CERT APROBADA
                                       │
       ↓                               ↓
   FACTURA BORRADOR ───────────→ FACTURA APROBADA
       (vinculada a CERT)              │
                                       ↓
       ↓                               ↓
   OP PENDIENTE ────────────────→ OP APROBADA
       (vinculada a FACTURA)           │
                                       ↓
                                  (Pago ejecutado)
                                       │
                                       ↓
                                  OP PAGADA ✓
```

---

## Estados y Reglas de Negocio

### Estados de la Orden de Compra

Una orden de compra puede estar en uno de los siguientes estados:

1. **Borrador:** Estado inicial al crear la orden. Puede modificarse libremente.
2. **En Aprobación:** La orden fue enviada para revisión. Ya no se puede modificar.
3. **Aprobado:** La orden fue autorizada. El proveedor puede ejecutar el trabajo.
4. **Rechazado:** La orden no fue autorizada. Debe rehacerse.
5. **Anulado:** La orden fue cancelada (solo supervisores o administradores pueden anular).

**Transiciones permitidas:**
- Borrador → En Aprobación (cualquier usuario)
- En Aprobación → Aprobado (supervisor o administrador)
- En Aprobación → Rechazado (supervisor o administrador)
- Cualquier estado → Anulado (supervisor o administrador)

**Regla:** Solo las órdenes en estado **Aprobado** pueden ser referenciadas en certificaciones.

---

### Estados de la Certificación

1. **Borrador:** Estado inicial al crear la certificación.
2. **Aprobado:** La certificación fue validada.
3. **Rechazado:** La certificación no fue aprobada.

**Transiciones permitidas:**
- Borrador → Aprobado (supervisor o administrador)
- Borrador → Rechazado (supervisor o administrador)

**Regla crítica:** Solo las certificaciones en estado **Aprobado** pueden vincularse a facturas.

---

### Estados de la Factura

1. **Borrador:** Estado inicial al cargar la factura.
2. **Aprobado:** La factura fue validada y autorizada para pago.
3. **Rechazado:** La factura no fue aprobada.
4. **Anulado:** La factura fue cancelada (solo supervisores o administradores).

**Transiciones permitidas:**
- Borrador → Aprobado (supervisor o administrador)
- Borrador → Rechazado (supervisor o administrador)
- Cualquier estado → Anulado (supervisor o administrador)

**Regla crítica:** Solo las facturas en estado **Aprobado** pueden incluirse en órdenes de pago.

---

### Estados de la Orden de Pago

1. **Pendiente:** Estado inicial al crear la orden de pago.
2. **Aprobado:** La orden fue autorizada para ejecutar el pago.
3. **Pagado:** El pago fue efectivamente realizado.
4. **Rechazado:** La orden no fue autorizada.

**Transiciones permitidas:**
- Pendiente → Aprobado (supervisor o administrador)
- Pendiente → Rechazado (supervisor o administrador)
- Aprobado → Pagado (supervisor o administrador)

**Regla:** Solo las órdenes de pago en estado **Aprobado** pueden marcarse como **Pagadas**.

---

### Estados del Proveedor

1. **Activo:** El proveedor está habilitado para operar.
2. **Inactivo (Suspendido):** El proveedor está suspendido temporalmente.

**Regla:** Un proveedor inactivo **no puede recibir nuevas órdenes de compra**, pero las órdenes históricas se conservan.

**Quién puede suspender:** Solo supervisores o administradores.

---

### Estados del Proyecto

1. **Planificado:** El proyecto aún no comenzó.
2. **En Ejecución:** El proyecto está activo.
3. **Finalizado:** El proyecto fue completado.
4. **Cancelado:** El proyecto fue cancelado.

**Nota:** El cambio de estado del proyecto no afecta los documentos vinculados a él.

---

## Reglas de Negocio Fundamentales

### Regla 1: Flujo Obligatorio Lineal

El sistema implementa un **flujo obligatorio** que no puede saltarse:

```
OC APROBADA → CERTIFICACIÓN APROBADA → FACTURA APROBADA → ORDEN DE PAGO
```

**No se puede:**
- Crear una factura sin certificación aprobada
- Crear una orden de pago sin factura aprobada
- Aprobar una certificación si no hay una OC aprobada del proveedor (aunque el sistema no valida código a código, la lógica operativa lo requiere)

---

### Regla 2: Mismo Proveedor en el Flujo

- Una certificación debe ser del mismo proveedor que las órdenes de compra asociadas
- Una factura debe vincularse a certificaciones del mismo proveedor
- Una orden de pago debe pagar facturas del mismo proveedor

**No se puede:** Mezclar proveedores en un mismo documento.

---

### Regla 3: Aprobaciones Jerárquicas

- Los usuarios pueden **crear** documentos (estado borrador o pendiente)
- Solo supervisores o administradores pueden **aprobar, rechazar o anular** documentos

**No se puede:** Un usuario estándar aprobar sus propias órdenes.

---

### Regla 4: Proveedor Activo para Nuevas Órdenes

- Solo los proveedores en estado **Activo** pueden recibir nuevas órdenes de compra
- Si un proveedor se suspende, las órdenes históricas se conservan, pero no se pueden crear nuevas

---

### Regla 5: Vinculación Múltiple Certificación-Factura

- Una factura puede vincularse a **varias certificaciones aprobadas** del mismo proveedor
- Esto permite facturar múltiples entregas o ejecuciones en un solo documento

---

### Regla 6: Números Secuenciales Automáticos

Todos los documentos se numeran automáticamente siguiendo el patrón:

```
PREFIJO-AÑO-NÚMERO

Ejemplos:
- OC-2025-001
- CERT-2025-023
- FACT-2025-107
- OP-2025-045
```

Los números se reinician cada año.

**No se puede:** Crear números duplicados ni saltar números.

---

### Regla 7: Cálculos Automáticos de Totales

El sistema calcula automáticamente:
- Total neto por línea = Cantidad × Precio Unitario Neto
- Total con IVA por línea = Total Neto × (1 + IVA% / 100)
- Total neto del documento = Suma de todos los totales netos de las líneas
- Total IVA del documento = Suma de todos los IVAs de las líneas
- Total con IVA del documento = Suma de todos los totales con IVA de las líneas

**No se puede:** Modificar manualmente los totales calculados.

---

### Regla 8: Monedas Soportadas

El sistema soporta tres monedas:
- **ARS:** Pesos argentinos
- **USD:** Dólares estadounidenses
- **EUR:** Euros

**Nota:** El sistema no realiza conversión automática entre monedas. Cada documento conserva su moneda original.

---

### Regla 9: Formas de Pago Disponibles

Las órdenes de pago pueden especificar cuatro formas de pago:
1. **Transferencia:** Pago electrónico a cuenta bancaria
2. **Cheque:** Emisión de cheque al proveedor
3. **Efectivo:** Pago en dinero efectivo
4. **Retención:** Monto retenido por obligaciones legales (impuestos, etc.)

Cada línea de pago puede tener una forma distinta.

---

## Beneficios del Sistema

### 1. Control Absoluto del Gasto

Gestión Uno garantiza que **no se pague nada que no haya sido previamente ordenado, recibido y facturado**. Cada etapa requiere aprobación formal.

**Beneficio:** Elimina pagos no autorizados, duplicados o fraudulentos.

---

### 2. Trazabilidad Completa

Cada documento del sistema está vinculado al anterior, creando una **cadena de trazabilidad** desde la orden inicial hasta el pago final.

**Beneficio:** Ante cualquier consulta o auditoría, es posible rastrear exactamente qué se ordenó, qué se recibió, qué se facturó y cuándo se pagó.

---

### 3. Separación de Responsabilidades

El sistema implementa una **clara separación entre quien solicita y quien aprueba**.

**Beneficio:** Reduce riesgos de errores y fraude al requerir validación de múltiples personas en el flujo.

---

### 4. Reducción de Errores Administrativos

Al automatizar la numeración de documentos, los cálculos de totales y las validaciones de flujo, se reducen drásticamente los errores humanos.

**Beneficio:** Información más confiable, menos trabajo correctivo y mayor productividad administrativa.

---

### 5. Orden y Organización

El sistema reemplaza procesos manuales (planillas, papeles, correos electrónicos) por un **flujo digital ordenado y centralizado**.

**Beneficio:** Toda la información está en un solo lugar, accesible según permisos, y organizada cronológicamente.

---

### 6. Seguimiento por Proyecto

Al vincular órdenes y certificaciones a proyectos específicos, es posible **conocer en cualquier momento cuánto se ha gastado en cada proyecto**.

**Beneficio:** Mejor control de costos por proyecto, facilitando la toma de decisiones y la planificación financiera.

---

### 7. Control de Proveedores

El sistema permite **suspender proveedores problemáticos** sin perder el historial de operaciones previas.

**Beneficio:** Mayor control sobre con quién se opera, protegiendo a la organización de proveedores no confiables.

---

### 8. Auditoría Facilitada

Todas las acciones relevantes quedan registradas: quién creó, quién aprobó, cuándo, qué cambió.

**Beneficio:** Facilita auditorías internas y externas, ahorrando tiempo y generando confianza.

---

### 9. Escalabilidad

El sistema está pensado para crecer con la organización: múltiples proyectos, múltiples proveedores, múltiples usuarios.

**Beneficio:** No es necesario cambiar de sistema al crecer. Gestión Uno se adapta al volumen de operaciones.

---

### 10. Acceso Controlado y Seguro

Mediante roles y permisos, cada usuario ve y hace únicamente lo que su rol le permite.

**Beneficio:** Información sensible protegida, minimizando riesgos de acceso no autorizado.

---

## Enfoque y Filosofía del Sistema

### Filosofía: Control por Etapas

Gestión Uno está construido sobre la idea de que **cada etapa del proceso debe validarse antes de avanzar a la siguiente**.

Esta filosofía se materializa en:
- **Creación en borrador:** Todo documento comienza como borrador, permitiendo correcciones antes de enviarlo a aprobación
- **Aprobación formal:** Un nivel superior revisa y aprueba cada documento
- **Imposibilidad de saltar etapas:** No se puede pagar sin factura aprobada, ni facturar sin certificación aprobada

---

### Enfoque: Trazabilidad Total

Cada documento del sistema está **vinculado explícitamente** al documento previo:
- La certificación referencia órdenes de compra
- La factura referencia certificaciones
- La orden de pago referencia facturas

Esto crea una **cadena de evidencia** que permite rastrear cualquier operación desde su origen hasta su cierre.

---

### Lógica: Aprobación Progresiva

El sistema implementa un modelo de **aprobación progresiva**, donde:
1. Los usuarios operativos **crean** los documentos
2. Los supervisores o administradores **validan** los documentos
3. Solo los documentos validados **avanzan** en el flujo

Este modelo garantiza que múltiples personas revisen cada operación, reduciendo errores y fraudes.

---

### Principio: Claridad Administrativa

Gestión Uno elimina ambigüedades:
- Cada documento tiene un número único
- Cada documento tiene un estado claro (borrador, aprobado, rechazado, etc.)
- Cada cambio de estado queda registrado
- Cada usuario tiene permisos explícitos

**Resultado:** No hay dudas sobre qué está aprobado, qué está pendiente, quién autorizó qué ni cuándo.

---

## Público Objetivo

### ¿Para quién está diseñado Gestión Uno?

#### Empresas Constructoras

Las empresas constructoras manejan múltiples obras simultáneas, decenas de proveedores (materiales, servicios, subcontratistas) y presupuestos ajustados.

**Gestión Uno les permite:**
- Controlar cuánto se gasta en cada obra
- Garantizar que solo se pague por lo efectivamente recibido
- Mantener orden administrativo en medio del caos operativo de múltiples frentes de trabajo

---

#### Desarrolladoras Inmobiliarias

Las desarrolladoras gestionan proyectos de largo plazo con múltiples proveedores y certificaciones periódicas de avance.

**Gestión Uno les permite:**
- Vincular gastos específicos a cada emprendimiento
- Controlar el flujo de certificaciones y pagos por etapa de obra
- Mantener trazabilidad completa para auditorías e inversores

---

#### Empresas con Procesos Formales de Compras

Cualquier organización mediana o grande que requiera:
- Aprobaciones formales antes de comprar
- Separación de responsabilidades (quien solicita ≠ quien aprueba)
- Control de presupuesto por área o proyecto
- Auditorías periódicas de gastos

**Gestión Uno les permite:**
- Implementar un proceso formal y trazable de compras
- Reducir riesgos administrativos y financieros
- Mejorar el control interno

---

#### Organizaciones con Múltiples Proyectos

Empresas que ejecutan múltiples proyectos en paralelo (consultoras, estudios de ingeniería, empresas de servicios) y necesitan:
- Saber cuánto cuesta cada proyecto
- Controlar que cada gasto esté justificado
- Evitar que gastos de un proyecto se imputen a otro

**Gestión Uno les permite:**
- Segmentar gastos por proyecto
- Obtener reportes de costo por proyecto
- Mantener control financiero claro

---

## Catálogo de Items: Agilidad en la Carga

### ¿Qué es el Catálogo de Items?

Es una **base de datos reutilizable** de productos y servicios que la organización compra frecuentemente.

**Información que contiene cada ítem:**
- Nombre del producto o servicio
- Descripción detallada
- Precio sugerido
- Unidad de medida (kilogramos, metros, litros, unidades, horas, etc.)
- Categoría (Materiales, Servicios, Equipos, Herramientas, Suministros, Otros)
- Estado: activo o inactivo

---

### ¿Para qué sirve?

Al crear una orden de compra, el usuario puede:
1. **Buscar en el catálogo** el producto o servicio que necesita
2. **Seleccionarlo** de la lista
3. El sistema **carga automáticamente** la descripción y el precio sugerido

**Beneficios:**
- **Ahorro de tiempo:** No es necesario escribir la misma descripción repetidamente
- **Consistencia:** Todos usan el mismo nombre y descripción para el mismo producto
- **Control de precios:** El precio sugerido sirve como referencia para detectar variaciones
- **Organización:** Las categorías facilitan la búsqueda

---

### Uso Opcional

El catálogo es **opcional**: el usuario puede cargar líneas de órdenes de compra sin usar el catálogo, escribiendo manualmente la descripción y el precio.

Esto da flexibilidad para compras puntuales de productos no habituales.

---

## Gestión de Proyectos: Seguimiento Financiero

### ¿Qué es un Proyecto en Gestión Uno?

Un proyecto es una **agrupación lógica** que permite vincular órdenes de compra y certificaciones para seguimiento financiero.

**Ejemplos de proyectos:**
- "Edificio Central Plaza"
- "Ampliación Planta Industrial"
- "Renovación Oficinas Rosario"

---

### ¿Qué se puede hacer con proyectos?

1. **Crear un proyecto** con nombre, código único, descripción y fechas
2. **Vincular órdenes de compra** al proyecto (opcional, puede haber OC sin proyecto)
3. **Vincular certificaciones** al proyecto (obligatorio, toda certificación tiene un proyecto)
4. **Cambiar el estado del proyecto** según su evolución:
   - Planificado → En Ejecución → Finalizado
   - O bien: Planificado → Cancelado

---

### Beneficios del Seguimiento por Proyecto

- **Visibilidad financiera:** Saber cuánto se ha ordenado, certificado y pagado en cada proyecto
- **Control de presupuesto:** Comparar lo gastado con lo presupuestado para cada proyecto
- **Organización:** Mantener separadas las compras de cada proyecto
- **Reportes:** Generar reportes financieros específicos por proyecto

---

## Auditoría y Registro de Cambios

### ¿Qué se registra?

El sistema lleva un **registro automático** de todas las acciones relevantes:
- Quién creó cada documento
- Quién aprobó o rechazó cada documento
- Quién modificó información
- Qué cambios se realizaron
- Cuándo ocurrió cada acción
- Desde qué dirección de red (IP) se realizó

---

### ¿Para qué sirve?

- **Auditorías:** Facilitar la revisión de operaciones pasadas
- **Control:** Detectar acciones irregulares o sospechosas
- **Responsabilidad:** Saber quién hizo qué y cuándo
- **Resolución de conflictos:** Ante discrepancias, revisar el historial de cambios

---

## Resumen Ejecutivo: ¿Por Qué Elegir Gestión Uno?

Gestión Uno es la solución para organizaciones que necesitan:

✓ **Control:** Garantizar que cada peso gastado esté autorizado y justificado

✓ **Orden:** Reemplazar procesos manuales caóticos por un flujo digital estructurado

✓ **Trazabilidad:** Rastrear cualquier operación desde su solicitud hasta su pago

✓ **Transparencia:** Saber en todo momento qué está pendiente, qué está aprobado y qué se ha pagado

✓ **Seguridad:** Separar responsabilidades y proteger información sensible mediante roles y permisos

✓ **Eficiencia:** Reducir errores administrativos, eliminar duplicaciones y ahorrar tiempo

✓ **Escalabilidad:** Crecer sin necesidad de cambiar de sistema

✓ **Auditoría:** Facilitar controles internos y externos con registros completos de todas las operaciones

---

## Caso de Uso Típico

**Empresa:** Constructora con 5 obras simultáneas, 40 proveedores activos, equipo administrativo de 8 personas.

**Problema:** Órdenes de compra en papel, proveedores que facturan sin certificación previa, pagos autorizados por correo electrónico, imposibilidad de saber en tiempo real cuánto se gastó en cada obra.

**Solución con Gestión Uno:**

1. **Mes 1:** Carga de proveedores, creación de proyectos (uno por obra), capacitación de usuarios
2. **Mes 2:** Todas las órdenes de compra se gestionan en el sistema (estado borrador → aprobación → aprobado)
3. **Mes 3:** Las certificaciones de obra se cargan digitalmente, vinculadas a cada proyecto
4. **Mes 4:** Las facturas se registran vinculadas a certificaciones, eliminando facturas sin respaldo
5. **Mes 5:** Las órdenes de pago se autorizan digitalmente, con trazabilidad completa

**Resultados al año:**
- 100% de las órdenes de compra aprobadas formalmente antes de la ejecución
- 0 pagos sin factura aprobada
- 0 facturas sin certificación previa
- Reducción del 70% en tiempo de auditoría mensual
- Visibilidad en tiempo real del costo de cada obra
- Reducción del 40% en errores administrativos

---

## Conclusión

**Gestión Uno** no es solo un sistema de registro: es una **metodología de control administrativo** implementada digitalmente.

Su filosofía se basa en tres pilares:

1. **Nada avanza sin aprobación formal**
2. **Todo está vinculado y trazado**
3. **Cada usuario hace solo lo que su rol le permite**

Esto transforma el caos administrativo en un **proceso ordenado, controlado y auditable**, protegiendo a la organización de errores, fraudes y pérdida de información.

Gestión Uno es la herramienta para organizaciones que valoran el control, la transparencia y la eficiencia administrativa.

---

**Gestión Uno: Control. Orden. Trazabilidad.**
