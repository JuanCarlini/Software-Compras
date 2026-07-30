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
import { ordenarPor, type DireccionOrden } from "@/shared/sort-utils"

export interface CampoOrden {
  clave: string
  etiqueta: string
}

export function useOrden(campos: CampoOrden[], inicial?: DireccionOrden) {
  const [campo, setCampo] = useState(campos[0].clave)
  const [direccion, setDireccion] = useState<DireccionOrden>(inicial ?? "desc")

  const ordenar = useCallback(
    <T extends Record<string, unknown>>(items: T[]) => ordenarPor(items, campo, direccion),
    [campo, direccion]
  )

  return { campos, campo, setCampo, direccion, setDireccion, ordenar }
}

type Props = Omit<ReturnType<typeof useOrden>, "ordenar">

export function OrdenControl({ campos, campo, setCampo, direccion, setDireccion }: Props) {
  const ascendente = direccion === "asc"
  const Icono = ascendente ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ordenar por</span>
      <Select value={campo} onValueChange={setCampo}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {campos.map((c) => (
            <SelectItem key={c.clave} value={c.clave}>
              {c.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDireccion(ascendente ? "desc" : "asc")}
        title={ascendente ? "Ascendente" : "Descendente"}
        aria-label={`Orden ${ascendente ? "ascendente" : "descendente"}, cambiar`}
      >
        <Icono className="h-4 w-4" />
      </Button>
    </div>
  )
}
