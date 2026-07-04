import { ProveedorForm } from "@/views/proveedor-form"

export default function NuevoProveedorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nuevo Proveedor</h1>
        <p className="text-slate-600">Registra un nuevo proveedor en el sistema</p>
      </div>
      
      <ProveedorForm />
    </div>
  )
}
