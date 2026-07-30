"use client"

import { useCallback, useState } from "react"
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sortBy, type SortDirection } from "@/shared/sort-utils"

export interface SortField {
  key: string
  label: string
}

export function useSort(fields: SortField[], initial?: SortDirection) {
  const [field, setCampo] = useState(fields[0].key)
  const [direction, setDireccion] = useState<SortDirection>(initial ?? "desc")

  const apply = useCallback(
    <T extends Record<string, unknown>>(items: T[]) => sortBy(items, field, direction),
    [field, direction]
  )

  return { fields, field, setCampo, direction, setDireccion, apply }
}

type Props = Omit<ReturnType<typeof useSort>, "apply">

export function SortControl({ fields, field, setCampo, direction, setDireccion }: Props) {
  const ascending = direction === "asc"
  const Icon = ascending ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ordenar por</span>
      <Select value={field} onValueChange={setCampo}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fields.map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDireccion(ascending ? "desc" : "asc")}
        title={ascending ? "Ascendente" : "Descendente"}
        aria-label={`Orden ${ascending ? "ascending" : "descendente"}, cambiar`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </div>
  )
}
