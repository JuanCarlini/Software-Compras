"use client"

import { Badge } from "@/views/ui/badge"

interface SearchStatsProps {
  totalItems: number
  filteredItems: number
  searchTerm: string
  entityName: string
}

export function SearchStats({ totalItems, filteredItems, searchTerm, entityName }: SearchStatsProps) {
  if (!searchTerm && filteredItems === totalItems) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
      {searchTerm && (
        <>
          <span>Búsqueda:</span>
          <Badge variant="secondary" className="font-normal">
            "{searchTerm}"
          </Badge>
        </>
      )}
      <span>
        Mostrando {filteredItems} de {totalItems} {entityName}
        {totalItems !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
