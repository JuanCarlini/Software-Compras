"use client"

import { FacturaForm } from "@/views/factura-form"

export default function NuevaFacturaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Factura</h1>
        <p className="text-muted-foreground">Crea una nueva factura de proveedor</p>
      </div>
      
      <FacturaForm />
    </div>
  )
}
