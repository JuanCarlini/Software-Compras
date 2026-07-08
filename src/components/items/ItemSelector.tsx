"use client"

import { useState } from "react"
import { Item } from "@/models"
import { ItemQuickCreateDialog } from "./ItemQuickCreateDialog"
import { ItemCombobox } from "./ItemCombobox"

interface ItemSelectorProps {
  value?: number | null
  onChange: (itemId: number | null, item: Item | null) => void
  onPriceAutoFill?: (price: number | null) => void
  userId?: number | null
  disabled?: boolean
  placeholder?: string
}

/**
 * Componente integrado que combina el Combobox de selección 
 * con el Dialog de creación rápida de items.
 * 
 * Uso en formularios de OC:
 * 
 * <ItemSelector
 *   value={selectedItemId}
 *   onChange={(itemId, item) => {
 *     setSelectedItemId(itemId)
 *     if (item?.precio_sugerido) {
 *       setPrecioUnitario(item.precio_sugerido)
 *     }
 *   }}
 *   userId={currentUserId}
 * />
 */
export function ItemSelector({
  value,
  onChange,
  onPriceAutoFill,
  userId,
  disabled = false,
  placeholder = "Seleccionar item...",
}: ItemSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // TODO(F3): el item ya no tiene precio_sugerido — el precio vive en
  // gu_item_proveedor_precio (por proveedor). Recablear onPriceAutoFill contra
  // GET /api/items/[id]/precio?proveedorId= cuando exista esa ruta.
  const handleItemCreated = (newItem: Item) => {
    // Seleccionar automáticamente el item recién creado
    onChange(newItem.id, newItem)
  }

  const handleItemChange = (itemId: number | null, item: Item | null) => {
    onChange(itemId, item)
  }

  return (
    <>
      <ItemCombobox
        value={value}
        onChange={handleItemChange}
        onCreateNew={() => setDialogOpen(true)}
        disabled={disabled}
        placeholder={placeholder}
      />

      <ItemQuickCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onItemCreated={handleItemCreated}
        userId={userId}
      />
    </>
  )
}
