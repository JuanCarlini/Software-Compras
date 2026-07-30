"use client"

import { useSearchParams } from "next/navigation"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

// Botones de exportacion: Excel pega contra la API, PDF es window.print() con la
// hoja @media print (grafico vectorial gratis, sin rasterizar).
export function AccionesExport({ reporte }: { reporte: string }) {
  const params = useSearchParams()

  function descargar(formato: string) {
    const query = new URLSearchParams(params.toString())
    query.set("formato", formato)
    window.location.href = `/api/reportes/${reporte}/export?${query.toString()}`
  }

  return (
    <div className="no-imprimir flex gap-2">
      <Button variant="outline" size="sm" onClick={() => descargar("xlsx")}>
        <Download className="mr-2 h-4 w-4" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        PDF
      </Button>
    </div>
  )
}
