"use client"

import { Suspense, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltrosBar, type Opcion } from "./filtros-bar"
import { TabCircuito } from "./tab-circuito"
import { TabPendiente } from "./tab-pendiente"
import { TabDeuda } from "./tab-deuda"
import { TabProveedores } from "./tab-proveedores"
import { TabProyectos } from "./tab-proyectos"
import { AccionesExport } from "./acciones-export"
import "./paleta.css"
import "@/app/(dashboard)/reportes/print.css"

// La pestaña activa viaja al nombre real del reporte: el value de la pestaña
// no siempre coincide con el nombre que espera la ruta de export.
const NOMBRE_API: Record<string, string> = {
  circuito: "circuito",
  pendiente: "pendiente-certificar",
  deuda: "deuda",
  proveedores: "proveedores",
  proyectos: "proyectos",
}

const TITULO_PESTANA: Record<string, string> = {
  circuito: "Circuito",
  pendiente: "Pendiente de certificar",
  deuda: "Deuda",
  proveedores: "Proveedores",
  proyectos: "Proyectos",
}

export function ReportesShell({
  proveedores,
  proyectos,
}: {
  proveedores: Opcion[]
  proyectos: Opcion[]
}) {
  const [activa, setActiva] = useState("circuito")

  return (
    <div className="reportes-viz space-y-6">
      {/* Solo visible al imprimir: en pantalla los filtros y las pestañas ya lo dicen. */}
      <div className="encabezado-impresion">
        <h2 className="text-xl font-bold">Reportes — {TITULO_PESTANA[activa]}</h2>
        <p className="text-sm">Generado el {new Date().toLocaleDateString("es-AR")}</p>
      </div>

      {/* FiltrosBar usa useSearchParams: sin Suspense, Next 15 rompe el prerenderizado
          de la página en el build. */}
      <Suspense>
        <FiltrosBar proveedores={proveedores} proyectos={proyectos} />
      </Suspense>

      <Tabs value={activa} onValueChange={setActiva}>
        <div className="flex items-center justify-between">
          <TabsList className="no-imprimir">
            <TabsTrigger value="circuito">Circuito</TabsTrigger>
            <TabsTrigger value="pendiente">Pendiente de certificar</TabsTrigger>
            <TabsTrigger value="deuda">Deuda</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
          </TabsList>
          <AccionesExport reporte={NOMBRE_API[activa]} />
        </div>

        <TabsContent value="circuito" className="mt-6"><TabCircuito /></TabsContent>
        <TabsContent value="pendiente" className="mt-6"><TabPendiente /></TabsContent>
        <TabsContent value="deuda" className="mt-6"><TabDeuda /></TabsContent>
        <TabsContent value="proveedores" className="mt-6"><TabProveedores /></TabsContent>
        <TabsContent value="proyectos" className="mt-6"><TabProyectos /></TabsContent>
      </Tabs>
    </div>
  )
}
