"use client"

import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltrosBar, type Opcion } from "./filtros-bar"
import "./paleta.css"

export function ReportesShell({
  proveedores,
  proyectos,
}: {
  proveedores: Opcion[]
  proyectos: Opcion[]
}) {
  return (
    <div className="reportes-viz space-y-6">
      {/* FiltrosBar usa useSearchParams: sin Suspense, Next 15 rompe el prerenderizado
          de la pagina en el build. */}
      <Suspense>
        <FiltrosBar proveedores={proveedores} proyectos={proyectos} />
      </Suspense>

      <Tabs defaultValue="circuito">
        <TabsList>
          <TabsTrigger value="circuito">Circuito</TabsTrigger>
          <TabsTrigger value="pendiente">Pendiente de certificar</TabsTrigger>
          <TabsTrigger value="deuda">Deuda</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
        </TabsList>

        <TabsContent value="circuito" className="mt-6" />
        <TabsContent value="pendiente" className="mt-6" />
        <TabsContent value="deuda" className="mt-6" />
        <TabsContent value="proveedores" className="mt-6" />
        <TabsContent value="proyectos" className="mt-6" />
      </Tabs>
    </div>
  )
}
