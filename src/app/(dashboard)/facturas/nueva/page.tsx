"use client"

import { FacturaForm } from "@/views/factura-form"

export default function NuevaFacturaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nueva Factura</h1>
        <p className="text-slate-600">Crea una nueva factura de proveedor</p>
      </div>
      
      <FacturaForm />
    </div>
  )
}
