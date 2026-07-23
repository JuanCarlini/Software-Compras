"use client"

import { useState } from "react"
import { Item } from "@/models"
import { ItemQuickCreateDialog } from "./item-quick-create-dialog"
import { ItemCombobox } from "./item-combobox"

interface ItemSelectorProps {
  value?: number | null
  onChange: (itemId: number | null, item: Item | null) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Componente integrado que combina el Combobox de selección
 * con el Dialog de creación rápida de items.
 *
 * El precio no vive en el item: en el modelo CCIP es por proveedor
 * (gu_item_proveedor_precio) y se resuelve en la línea de OC.
 *
 * <ItemSelector
 *   value={selectedItemId}
 *   onChange={(itemId, item) => setSelectedItemId(itemId)}
 * />
 */
export function ItemSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar item...",
}: ItemSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

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
      />
    </>
  )
}
