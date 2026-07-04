"use client"

import { FacturasList } from "@/views/facturas-list"

export default function FacturasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Facturas</h1>
        <p className="text-slate-600">Gestiona las facturas de proveedores</p>
      </div>
      
      <FacturasList />
    </div>
  )
}
