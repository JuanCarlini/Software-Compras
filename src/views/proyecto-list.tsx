"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/ui/search-bar"
import { SearchStats } from "@/components/ui/search-stats"
import { ListShell } from "@/components/ui/list-shell"
import { OrdenControl, useOrden, type CampoOrden } from "@/components/ui/orden-control"
import { Edit, FolderKanban } from "lucide-react"
import { useProyectos } from "@/hooks/use-proyectos"
import { useAuth } from "@/components/auth-context"
import { searchWithScore } from "@/shared/search-utils"
import { formatDateShort } from "@/shared/date-utils"
import { LABEL_PROYECTO_ESTADO } from "@/shared/validation/proyecto-validation"
import type { EstadoProyecto } from "@/models/proyecto.model"

const ESTILO_ESTADO: Record<EstadoProyecto, string> = {
  planificado: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  en_ejecucion: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  finalizado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
}

const CAMPOS_ORDEN: CampoOrden[] = [
  { clave: "nombre", etiqueta: "Nombre" },
  { clave: "codigo", etiqueta: "Código" },
  { clave: "fecha_inicio", etiqueta: "Fecha de inicio" },
  { clave: "estado", etiqueta: "Estado" },
]

export function ProyectoList() {
  const { proyectos, cargando, error } = useProyectos()
  const { puede } = useAuth()
  const [busqueda, setBusqueda] = useState("")
  const orden = useOrden(CAMPOS_ORDEN, "asc")

  const puedeEditar = puede("proyectos", "crear")

  const filtrados = orden.ordenar(
    searchWithScore(
      proyectos,
      busqueda,
      ["nombre", "codigo", "descripcion"],
      { nombre: 3, codigo: 3, descripcion: 1 }
    )
  )

  return (
    <ListShell loading={cargando} error={error} loadingText="Cargando proyectos...">
      <div className="space-y-4">
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, código o descripción..."
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchStats
            totalItems={proyectos.length}
            filteredItems={filtrados.length}
            searchTerm={busqueda}
            entityName="proyectos"
          />
          <OrdenControl {...orden} />
        </div>

        {filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {proyectos.length === 0
                ? "Todavía no hay proyectos cargados."
                : "Ningún proyecto coincide con la búsqueda."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtrados.map((proyecto) => (
              <Card key={proyecto.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      {proyecto.nombre}
                    </CardTitle>
                    {proyecto.codigo && (
                      <p className="text-sm text-muted-foreground">{proyecto.codigo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {proyecto.estado && (
                      <Badge className={ESTILO_ESTADO[proyecto.estado]}>
                        {LABEL_PROYECTO_ESTADO[proyecto.estado]}
                      </Badge>
                    )}
                    {puedeEditar && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/proyectos/${proyecto.id}/editar`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {proyecto.descripcion && (
                    <p className="text-sm text-muted-foreground">{proyecto.descripcion}</p>
                  )}
                  {(proyecto.fecha_inicio || proyecto.fecha_fin) && (
                    <p className="text-sm text-muted-foreground">
                      {proyecto.fecha_inicio ? formatDateShort(proyecto.fecha_inicio) : "Sin inicio"}
                      {" — "}
                      {proyecto.fecha_fin ? formatDateShort(proyecto.fecha_fin) : "Sin cierre"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ListShell>
  )
}
