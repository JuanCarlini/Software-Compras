# Componentes de Items - Guía de Uso

## Resumen

Este módulo proporciona tres componentes principales para trabajar con items en el sistema:

1. **ItemQuickCreateDialog** - Dialog para crear items rápidamente
2. **ItemCombobox** - Selector con búsqueda de items
3. **ItemSelector** - Componente integrado (Combobox + Dialog)

Además incluye un hook personalizado `useItems` para operaciones con items.

---

## 1. ItemQuickCreateDialog

Dialog modal para crear nuevos items rápidamente desde cualquier parte de la aplicación.

### Props

```typescript
interface ItemQuickCreateDialogProps {
  open: boolean                          // Controla la visibilidad del dialog
  onOpenChange: (open: boolean) => void  // Callback cuando cambia el estado
  onItemCreated?: (item: Item) => void   // Callback cuando se crea un item
  userId?: number | null                 // ID del usuario creador
}
```

### Ejemplo de Uso

```tsx
import { useState } from "react"
import { ItemQuickCreateDialog } from "@/components/items"
import { Button } from "@/views/ui/button"

function MiComponente() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleItemCreated = (newItem) => {
    console.log("Item creado:", newItem)
    // Hacer algo con el nuevo item
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Crear Nuevo Item
      </Button>

      <ItemQuickCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onItemCreated={handleItemCreated}
        userId={1}
      />
    </>
  )
}
```

### Características

- ✅ Validación con Zod
- ✅ Loading states durante la creación
- ✅ Manejo de errores con toast notifications
- ✅ Campos: nombre*, descripción, precio sugerido, unidad de medida, categoría
- ✅ Selects con valores predefinidos (categorías y unidades de medida)
- ✅ Reset automático del formulario al cerrar

---

## 2. ItemCombobox

Combobox con búsqueda para seleccionar items del catálogo.

### Props

```typescript
interface ItemComboboxProps {
  value?: number | null                               // ID del item seleccionado
  onChange: (itemId: number | null, item: Item | null) => void  // Callback de selección
  onCreateNew: () => void                             // Callback para crear nuevo item
  disabled?: boolean                                  // Deshabilitar el combobox
  placeholder?: string                                // Texto placeholder
}
```

### Ejemplo de Uso

```tsx
import { useState } from "react"
import { ItemCombobox } from "@/components/items"
import { Item } from "@/models"

function FormularioOC() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleItemChange = (itemId: number | null, item: Item | null) => {
    setSelectedItemId(itemId)
    setSelectedItem(item)

    // Autocompletar precio si existe
    if (item?.precio_sugerido) {
      // setPrecioUnitario(item.precio_sugerido)
    }
  }

  return (
    <div>
      <label>Producto / Servicio</label>
      <ItemCombobox
        value={selectedItemId}
        onChange={handleItemChange}
        onCreateNew={() => setCreateDialogOpen(true)}
        placeholder="Buscar o crear item..."
      />

      {selectedItem && (
        <div className="text-sm text-muted-foreground mt-2">
          {selectedItem.descripcion && <p>{selectedItem.descripcion}</p>}
          {selectedItem.precio_sugerido && (
            <p>Precio sugerido: ${selectedItem.precio_sugerido}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

### Características

- ✅ Búsqueda en tiempo real (mínimo 2 caracteres)
- ✅ Muestra nombre, descripción, precio, unidad y categoría de cada item
- ✅ Opción de limpiar selección
- ✅ Botón "Crear nuevo item" integrado
- ✅ Loading states durante búsquedas
- ✅ Estado vacío personalizado

---

## 3. ItemSelector (Recomendado)

Componente todo-en-uno que combina ItemCombobox + ItemQuickCreateDialog.

### Props

```typescript
interface ItemSelectorProps {
  value?: number | null                               // ID del item seleccionado
  onChange: (itemId: number | null, item: Item | null) => void  // Callback de selección
  onPriceAutoFill?: (price: number | null) => void   // Callback para autocompletar precio
  userId?: number | null                              // ID del usuario
  disabled?: boolean                                  // Deshabilitar
  placeholder?: string                                // Placeholder
}
```

### Ejemplo de Uso (Recomendado para Formularios de OC)

```tsx
import { useState } from "react"
import { ItemSelector } from "@/components/items"

function FormularioLineaOC() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [cantidad, setCantidad] = useState<number>(1)

  return (
    <div className="space-y-4">
      {/* Selector de Item */}
      <div>
        <label>Producto / Servicio *</label>
        <ItemSelector
          value={selectedItemId}
          onChange={(itemId, item) => {
            setSelectedItemId(itemId)
            // El precio se autocompleta automáticamente via onPriceAutoFill
          }}
          onPriceAutoFill={(price) => {
            if (price) setPrecioUnitario(price)
          }}
          userId={1}
          placeholder="Buscar o crear item..."
        />
      </div>

      {/* Cantidad */}
      <div>
        <label>Cantidad *</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(parseFloat(e.target.value))}
        />
      </div>

      {/* Precio Unitario (autocompletado, pero editable) */}
      <div>
        <label>Precio Unitario *</label>
        <input
          type="number"
          value={precioUnitario}
          onChange={(e) => setPrecioUnitario(parseFloat(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          El precio se autocompleta desde el item, pero puedes editarlo
        </p>
      </div>

      {/* Total calculado */}
      <div>
        <p>Total: ${(cantidad * precioUnitario).toFixed(2)}</p>
      </div>
    </div>
  )
}
```

### Ventajas de ItemSelector

- ✅ Maneja automáticamente la apertura/cierre del dialog
- ✅ Selecciona automáticamente el item recién creado
- ✅ Autocompleta el precio si está disponible
- ✅ Menos código boilerplate
- ✅ UX consistente

---

## 4. Hook useItems

Hook personalizado para operaciones con items.

### API

```typescript
const {
  items,              // Item[] - Lista de items
  isLoading,          // boolean - Estado de carga
  error,              // string | null - Mensaje de error
  loadItems,          // () => Promise<void> - Cargar todos los items
  searchItems,        // (query: string) => Promise<void> - Buscar items
  createItem,         // (data: Partial<Item>) => Promise<Item | null>
  getItemById,        // (id: number) => Promise<Item | null>
} = useItems()
```

### Ejemplo de Uso

```tsx
import { useEffect } from "react"
import { useItems } from "@/shared/use-items"

function ListaItems() {
  const { items, isLoading, error, loadItems, searchItems } = useItems()

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleSearch = (query: string) => {
    if (query.length >= 2) {
      searchItems(query)
    } else {
      loadItems()
    }
  }

  if (isLoading) return <p>Cargando...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar items..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.nombre} - ${item.precio_sugerido}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Flujo Completo: Crear Línea de OC con Items

```tsx
"use client"

import { useState } from "react"
import { ItemSelector } from "@/components/items"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"

export function FormularioLineaOC({ ordenId, userId }) {
  const [itemId, setItemId] = useState<number | null>(null)
  const [cantidad, setCantidad] = useState<number>(1)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [ivaPorc, setIvaPorc] = useState<number>(21)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemId || cantidad <= 0 || precioUnitario < 0) {
      alert("Por favor completa todos los campos")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/ordenes-compra/${ordenId}/lineas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          cantidad,
          precio_unitario_neto: precioUnitario,
          iva_porcentaje: ivaPorc,
        }),
      })

      if (!response.ok) throw new Error("Error al crear línea")

      const nuevaLinea = await response.json()
      console.log("Línea creada:", nuevaLinea)

      // Reset form
      setItemId(null)
      setCantidad(1)
      setPrecioUnitario(0)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear la línea")
    } finally {
      setLoading(false)
    }
  }

  const totalNeto = cantidad * precioUnitario
  const totalConIva = totalNeto * (1 + ivaPorc / 100)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Producto / Servicio *</Label>
        <ItemSelector
          value={itemId}
          onChange={(id) => setItemId(id)}
          onPriceAutoFill={setPrecioUnitario}
          userId={userId}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cantidad *</Label>
          <Input
            type="number"
            step="0.01"
            value={cantidad}
            onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label>Precio Unitario *</Label>
          <Input
            type="number"
            step="0.01"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label>IVA %</Label>
        <Input
          type="number"
          value={ivaPorc}
          onChange={(e) => setIvaPorc(parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm">Total Neto: ${totalNeto.toFixed(2)}</p>
        <p className="text-sm font-bold">
          Total con IVA: ${totalConIva.toFixed(2)}
        </p>
      </div>

      <Button type="submit" disabled={loading || !itemId}>
        {loading ? "Agregando..." : "Agregar Línea"}
      </Button>
    </form>
  )
}
```

---

## Notas Importantes

### Autocompletado de Precio

El precio se autocompleta desde `item.precio_sugerido` pero **siempre es editable** por el usuario. Esto permite:
- Velocidad al crear líneas (precio pre-cargado)
- Flexibilidad para negociaciones específicas
- Mantener el precio sugerido del item intacto

### Validaciones

Todos los componentes usan Zod para validación:
- **Nombre**: Requerido, 2-200 caracteres
- **Precio**: Opcional, no negativo
- **Cantidad**: Debe ser positiva
- **IVA**: Debe ser no negativo

### Performance

- Búsquedas limitadas a 20 resultados
- Debounce implícito (búsqueda con mínimo 2 caracteres)
- Carga lazy de items (solo cuando se necesitan)

---

## Próximos Pasos

1. Integrar `ItemSelector` en formulario de nueva OC
2. Reemplazar input de "Producto" actual con el combobox
3. Testear flujo completo de creación
4. Agregar analytics sobre items más usados
