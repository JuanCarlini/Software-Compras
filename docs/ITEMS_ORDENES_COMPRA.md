# Actualización: Sistema de Items en Órdenes de Compra

## Resumen de Cambios

Esta actualización integra el catálogo de items con las órdenes de compra, permitiendo:
- Seleccionar items del catálogo al crear líneas de OC
- Autocompletar precios sugeridos (editables)
- Mantener compatibilidad con el modo legacy (descripción manual)
- Tracking de qué items se usan en las OCs

---

## 1. Cambios en el Modelo

### `src/models/orden-compra.model.ts`

#### Interfaces Actualizadas:

**OrdenCompraLinea** - Ahora incluye `item_id`:
```typescript
export interface OrdenCompraLinea {
  id: number
  orden_compra_id: number
  item_id?: number | null          // NUEVO: FK a gu_items
  item_codigo: string | null
  descripcion: string
  cantidad: number
  precio_unitario_neto: number
  iva_porcentaje: number
  total_neto: number
  total_con_iva: number
  estado: string | null
}
```

**CreateOrdenCompraLinea** - Permite crear líneas con items:
```typescript
export interface CreateOrdenCompraLinea {
  orden_compra_id: number
  item_id?: number | null          // NUEVO
  item_codigo?: string | null
  descripcion: string              // Requerido siempre (nombre del item o custom)
  cantidad: number
  precio_unitario_neto: number
  iva_porcentaje: number
  total_neto: number
  total_con_iva: number
  estado?: string | null
}
```

#### Nuevas Interfaces:

**OrdenCompraLineaConItem** - Línea con info del item cargada:
```typescript
export interface OrdenCompraLineaConItem extends OrdenCompraLinea {
  item?: {
    id: number
    nombre: string
    descripcion?: string | null
    precio_sugerido?: number | null
    unidad_medida?: string | null
    categoria?: string | null
  } | null
}
```

**CreateLineaFromItem** - Helper para crear desde catálogo:
```typescript
export interface CreateLineaFromItem {
  item_id: number
  cantidad: number
  precio_unitario_neto?: number    // Opcional: usa precio_sugerido si no se provee
  iva_porcentaje?: number           // Default 21
  descripcion?: string              // Opcional: complementa nombre del item
}
```

---

## 2. Cambios en el Controller

### `src/controllers/orden-compra.controller.ts`

#### Nuevos Métodos:

**getLinesWithItems(ordenId)** - Obtiene líneas con JOIN a items:
```typescript
static async getLinesWithItems(ordenId: number): Promise<OrdenCompraLineaConItem[]>
```
- Retorna líneas con información completa del item del catálogo
- Usa LEFT JOIN: si no hay item_id, item será null
- Útil para mostrar detalles del item en la UI

**createLineFromItem(ordenId, lineaData)** - Crea línea desde item:
```typescript
static async createLineFromItem(
  ordenId: number,
  lineaData: CreateLineaFromItem
): Promise<OrdenCompraLinea>
```
- Busca el item en el catálogo
- Autocompleta precio desde `precio_sugerido` (o usa el provisto)
- Usa nombre del item como descripción (o usa la provista)
- Calcula totales automáticamente
- IVA por defecto: 21%

**updateLine(lineaId, updates)** - Actualiza línea existente:
```typescript
static async updateLine(
  lineaId: number,
  updates: Partial<CreateOrdenCompraLinea>
): Promise<OrdenCompraLinea | null>
```
- Recalcula totales automáticamente si cambia cantidad, precio o IVA
- Permite cambiar el item_id asociado
- Retorna null si la línea no existe

**deleteLine(lineaId)** - Elimina una línea:
```typescript
static async deleteLine(lineaId: number): Promise<boolean>
```
- Eliminación física de la línea
- Retorna true si tuvo éxito

---

## 3. Nuevos Endpoints API

### GET /api/ordenes-compra/[id]/lineas
Obtener líneas de una OC con información de items del catálogo

**Response:**
```json
[
  {
    "id": 1,
    "orden_compra_id": 123,
    "item_id": 5,
    "descripcion": "Cemento Portland",
    "cantidad": 10,
    "precio_unitario_neto": 1500.00,
    "item": {
      "id": 5,
      "nombre": "Cemento Portland",
      "precio_sugerido": 1500.00,
      "unidad_medida": "bolsas",
      "categoria": "Materiales"
    }
  }
]
```

### POST /api/ordenes-compra/[id]/lineas
Crear nueva línea desde item del catálogo

**Request:**
```json
{
  "item_id": 5,
  "cantidad": 10,
  "precio_unitario_neto": 1600.00,  // Opcional: usa precio_sugerido si no se envía
  "iva_porcentaje": 21,              // Opcional: default 21
  "descripcion": "Cemento modificado" // Opcional: usa nombre del item si no se envía
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "orden_compra_id": 123,
  "item_id": 5,
  "descripcion": "Cemento modificado",
  "cantidad": 10,
  "precio_unitario_neto": 1600.00,
  "total_neto": 16000.00,
  "total_con_iva": 19360.00
}
```

### PUT /api/ordenes-compra/lineas/[lineaId]
Actualizar una línea existente

**Request:** (todos los campos opcionales)
```json
{
  "cantidad": 15,
  "precio_unitario_neto": 1550.00
}
```

**Response:** Línea actualizada con totales recalculados

### DELETE /api/ordenes-compra/lineas/[lineaId]
Eliminar una línea

**Response:**
```json
{
  "message": "Línea eliminada correctamente"
}
```

---

## 4. Flujo de Uso

### Modo 1: Crear línea desde catálogo de items (NUEVO)

```javascript
// 1. Buscar/seleccionar item del catálogo
const items = await fetch('/api/items/search?query=cemento').then(r => r.json())
const itemSeleccionado = items[0] // Usuario selecciona

// 2. Crear línea desde el item
const response = await fetch('/api/ordenes-compra/123/lineas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_id: itemSeleccionado.id,
    cantidad: 10
    // precio_unitario_neto se autocompleta desde item.precio_sugerido
  })
})
```

### Modo 2: Crear línea con item pero precio personalizado

```javascript
const response = await fetch('/api/ordenes-compra/123/lineas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_id: itemSeleccionado.id,
    cantidad: 10,
    precio_unitario_neto: 1600.00  // Usuario editó el precio sugerido
  })
})
```

### Modo 3: Crear línea legacy (sin item del catálogo)

```javascript
// Usar el método antiguo createLines()
const lineas = [{
  orden_compra_id: 123,
  item_id: null,              // Sin item del catálogo
  descripcion: "Item personalizado",
  cantidad: 5,
  precio_unitario_neto: 1000.00,
  // ... resto de campos
}]

await OrdenCompraService.createLines(lineas)
```

---

## 5. Compatibilidad

### ✅ Backward Compatible
- Las OCs existentes siguen funcionando (item_id es nullable)
- El método `createLines()` original sigue disponible
- El campo `descripcion` sigue siendo requerido en todos los casos
- Las líneas sin item_id se manejan normalmente (modo legacy)

### ✅ Forward Compatible
- Los nuevos métodos conviven con los antiguos
- El frontend puede migrar gradualmente a usar items
- Puedes mezclar líneas con items y sin items en la misma OC

---

## 6. Validaciones

### Zod Schemas

**CreateLineaFromItemSchema:**
```typescript
{
  item_id: number (positivo, requerido)
  cantidad: number (positivo, requerido)
  precio_unitario_neto: number (>= 0, opcional)
  iva_porcentaje: number (>= 0, opcional)
  descripcion: string (opcional)
}
```

**UpdateLineaSchema:**
```typescript
{
  item_id: number (positivo, opcional)
  descripcion: string (opcional)
  cantidad: number (positivo, opcional)
  precio_unitario_neto: number (>= 0, opcional)
  iva_porcentaje: number (>= 0, opcional)
}
```

---

## 7. Casos de Uso Reales

### Caso 1: Usuario crea OC nueva con items del catálogo
1. Usuario busca "cemento" en el desplegable de items
2. Selecciona "Cemento Portland"
3. Campo precio se autocompleta con $1,500 (puede editarlo)
4. Ingresa cantidad: 10
5. Sistema crea línea con item_id=5, usando datos del catálogo

### Caso 2: Usuario crea item personalizado en el momento
1. Usuario escribe "Cemento especial modificado" (no existe en catálogo)
2. Click en "+ Crear nuevo item"
3. Completa formulario rápido del item
4. Item se guarda y queda seleccionado automáticamente
5. Crea la línea con el nuevo item

### Caso 3: Usuario edita precio sugerido
1. Selecciona item "Arena gruesa" (precio sugerido: $500)
2. Sistema autocompleta precio en $500
3. Usuario lo cambia manualmente a $550 (negociación con proveedor)
4. Línea se crea con precio $550, pero item mantiene su precio_sugerido en $500

### Caso 4: Item custom sin catálogo (legacy)
1. Usuario escribe directamente "Servicio de consultoría especializada"
2. No selecciona ningún item del catálogo
3. Ingresa cantidad y precio manualmente
4. Línea se crea sin item_id (modo legacy)

---

## 8. Próximos Pasos para Frontend

**Prioridad 6:** Crear dialog de creación rápida de items
**Prioridad 7:** Modificar formulario de OC para usar combobox con items
**Prioridad 8:** Implementar autocompletado de precio con edición manual

---

## 9. Notas Técnicas

- **Recálculo automático:** Los totales se recalculan en `updateLine()` cuando cambia cantidad, precio o IVA
- **JOIN optimizado:** `getLinesWithItems()` hace LEFT JOIN para incluir info del item
- **Protección:** No se puede eliminar un item del catálogo si está en uso (verificado en el endpoint DELETE de items)
- **Performance:** Las búsquedas de items están limitadas a 20 resultados
- **Trigger:** La tabla gu_items tiene trigger automático para updated_at
