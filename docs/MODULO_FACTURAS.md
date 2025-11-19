# Módulo de Facturas - Implementación Completa

## Resumen
Se ha completado la implementación del módulo de **Facturas** en el sistema Gestión Uno, permitiendo:
- Gestionar facturas de proveedores
- Asociar múltiples certificaciones aprobadas a cada factura
- Listado, creación y visualización de facturas
- Cálculo automático de totales con IVA

## Estructura de Base de Datos

### Tablas Principales

#### gu_facturas
- `id`: Identificador único
- `numero_factura`: Número de factura (generado automáticamente: FACT-YYYY-NNN)
- `proveedor_id`: Referencia al proveedor
- `fecha_factura`: Fecha de emisión
- `total_neto`: Subtotal sin IVA
- `total_iva`: Total de IVA
- `total_con_iva`: Total final
- `estado`: pendiente | pagada | anulada
- `created_at`: Fecha de creación

#### gu_lineasdefactura
- `id`: Identificador único
- `factura_id`: Referencia a la factura
- `descripcion`: Descripción del ítem
- `cantidad`: Cantidad
- `precio_unitario`: Precio unitario
- `iva_porcentaje`: Porcentaje de IVA (default: 21)
- `total_neto`: Total sin IVA de la línea
- `total_con_iva`: Total con IVA de la línea
- `estado`: Estado de la línea

#### gu_facturas_certificaciones (NUEVA)
- `id`: Identificador único
- `factura_id`: Referencia a la factura
- `certificacion_id`: Referencia a la certificación
- `created_at`: Fecha de creación
- **Constraint único**: Una certificación no puede asociarse dos veces a la misma factura

### Índices
- `idx_fact_proveedor`: Índice en proveedor_id
- `idx_fact_estado`: Índice en estado
- `idx_lfact_fact`: Índice en factura_id (líneas)
- `idx_factcert_fact`: Índice en factura_id (relación)
- `idx_factcert_cert`: Índice en certificacion_id (relación)

## Archivos Creados/Modificados

### Base de Datos
- ✅ `supabase/schema.sql` - Actualizado con tabla de relación
- ✅ `supabase/migration_facturas_certificaciones.sql` - Script de migración

### Backend (Controllers)
- ✅ `src/controllers/factura.controller.ts` - Service con métodos:
  - `getAll()` - Obtener todas las facturas
  - `getById(id)` - Obtener factura con líneas y certificaciones
  - `getCertificacionesAprobadas(proveedorId)` - Filtrar certificaciones aprobadas
  - `create(data)` - Crear factura con líneas y certificaciones
  - `update(id, data)` - Actualizar factura
  - `delete(id)` - Eliminar factura

### API Routes
- ✅ `src/app/api/facturas/route.ts` - GET y POST
- ✅ `src/app/api/facturas/[id]/route.ts` - GET, PUT, DELETE
- ✅ `src/app/api/facturas/certificaciones-aprobadas/route.ts` - GET filtrado

### Frontend (Pages)
- ✅ `src/app/(dashboard)/facturas/page.tsx` - Lista de facturas
- ✅ `src/app/(dashboard)/facturas/nueva/page.tsx` - Nueva factura
- ✅ `src/app/(dashboard)/facturas/[id]/page.tsx` - Detalle de factura

### Frontend (Components)
- ✅ `src/views/facturas-list.tsx` - Listado con cards
- ✅ `src/views/factura-form.tsx` - Formulario de creación con:
  - Selección de proveedor
  - Fecha de factura
  - Estado
  - **Selección múltiple de certificaciones aprobadas** del proveedor
  - Líneas dinámicas con cálculo automático de totales
  - Resumen de totales (neto, IVA, total)
- ✅ `src/views/factura-detail.tsx` - Vista detallada con:
  - Información de la factura
  - Datos del proveedor
  - Certificaciones asociadas (con links)
  - Líneas de la factura
  - Resumen financiero

### Navegación
- ✅ `src/views/app-sidebar.tsx` - Agregado menú de Facturas
- ✅ `src/routes/routes.config.ts` - Actualizado con rutas de facturas

## Funcionalidades Implementadas

### 1. Listado de Facturas
- Vista de cards con información resumida
- Badges de estado (Pendiente, Pagada, Anulada)
- Click para ver detalle
- Botón para crear nueva factura

### 2. Formulario de Nueva Factura
**Sección: Información de la Factura**
- Selección de proveedor (dropdown)
- Fecha de factura (date picker)
- Estado (dropdown: pendiente, pagada, anulada)

**Sección: Certificaciones Aprobadas**
- Se cargan automáticamente al seleccionar proveedor
- Solo muestra certificaciones en estado "aprobado"
- Checkboxes para selección múltiple
- Muestra: número, fecha y total de cada certificación
- Alerta si no hay certificaciones aprobadas

**Sección: Líneas de la Factura**
- Agregar/eliminar líneas dinámicamente
- Campos por línea:
  - Descripción
  - Cantidad
  - Precio unitario
  - IVA (%)
  - Total calculado automáticamente
- Cálculo en tiempo real

**Sección: Totales**
- Subtotal (Neto)
- IVA total
- Total con IVA
- Actualización automática al modificar líneas

### 3. Vista de Detalle
- Número de factura y estado
- Información completa del proveedor
- Lista de certificaciones asociadas (clickeables)
- Detalle de todas las líneas
- Resumen financiero completo
- Botón para volver al listado

## Lógica de Negocio Implementada

### Generación Automática de Número
- Formato: `FACT-YYYY-NNN`
- Año actual + correlativo de 3 dígitos
- Se reinicia el correlativo cada año

### Validaciones
1. **Proveedor**: Obligatorio
2. **Fecha**: Obligatoria
3. **Líneas**: Al menos una línea con descripción
4. **Certificaciones**: Solo aprobadas del mismo proveedor
5. **Relación única**: Una certificación no se puede asociar dos veces a la misma factura

### Cálculos Automáticos
```typescript
// Por cada línea:
total_neto_linea = cantidad × precio_unitario
total_iva_linea = total_neto_linea × (iva_porcentaje / 100)
total_con_iva_linea = total_neto_linea + total_iva_linea

// Totales de la factura:
total_neto = Σ(total_neto_linea)
total_iva = Σ(total_iva_linea)
total_con_iva = total_neto + total_iva
```

## Integración con Otros Módulos

### Relación con Certificaciones
- Una factura puede tener **múltiples certificaciones**
- Solo certificaciones en estado **"aprobado"**
- Certificaciones del **mismo proveedor** de la factura
- Click en certificación lleva a su detalle

### Relación con Proveedores
- Cada factura pertenece a **un proveedor**
- Se muestran todos los datos del proveedor en el detalle
- Filtrado automático de certificaciones por proveedor

### Relación con Órdenes de Pago (futuro)
- Las órdenes de pago pueden referenciar facturas
- Ya existe `gu_lineasdeordenesdepago.factura_id`

## Pasos para Activar en Producción

### 1. Ejecutar Migración de Base de Datos
```sql
-- Ejecutar en Supabase SQL Editor:
-- Opción A: Ejecutar el schema completo actualizado
-- Opción B: Ejecutar solo la migración
supabase/migration_facturas_certificaciones.sql
```

### 2. Verificar Permisos RLS (Row Level Security)
```sql
-- Verificar que existan policies para gu_facturas_certificaciones
-- Similar a las otras tablas del sistema
```

### 3. Deploy del Código
- El código ya está integrado en el proyecto
- No requiere instalación de dependencias adicionales
- Todos los componentes UI ya existen (checkbox, etc.)

### 4. Verificar Funcionalidad
1. Login al sistema
2. Ir a menú "Facturas"
3. Crear nueva factura
4. Seleccionar proveedor con certificaciones aprobadas
5. Verificar que aparezcan las certificaciones
6. Agregar líneas
7. Guardar y verificar
8. Ver detalle de la factura creada

## Próximos Pasos Sugeridos

### Mejoras Corto Plazo
- [ ] Validación de duplicados de número de factura
- [ ] Opción de editar factura existente
- [ ] Filtros en el listado (por proveedor, estado, fechas)
- [ ] Exportar factura a PDF
- [ ] Búsqueda de facturas

### Mejoras Mediano Plazo
- [ ] Importar líneas desde certificación seleccionada
- [ ] Histórico de cambios (audit log)
- [ ] Notificaciones al crear factura
- [ ] Dashboard de facturas pendientes
- [ ] Integración con sistema contable

### Mejoras Largo Plazo
- [ ] OCR para escanear facturas físicas
- [ ] Workflow de aprobación de facturas
- [ ] Alertas de vencimiento
- [ ] Reportes de facturas por período
- [ ] Integración con AFIP (factura electrónica)

## Notas Técnicas

### Performance
- Índices creados en todas las foreign keys
- Consultas optimizadas con `select` específico
- Paginación disponible si se requiere

### Seguridad
- Todas las rutas requieren autenticación (middleware)
- Validación de datos en backend
- Relaciones con ON DELETE CASCADE donde corresponde

### Mantenibilidad
- Código sigue patrones establecidos en el proyecto
- Componentes reutilizables
- Service layer para lógica de negocio
- TypeScript para type safety

## Soporte

Para dudas o problemas con el módulo de facturas:
1. Revisar este documento
2. Verificar logs de Supabase
3. Revisar console.log en navegador
4. Verificar que la migración se ejecutó correctamente

---

**Fecha de Implementación**: 11 de Noviembre, 2024
**Versión**: 1.0.0
**Estado**: ✅ Completo y listo para producción
