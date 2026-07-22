import { FacturasList } from "@/views/facturas-list"
import { CrearButton } from "@/views/crear-button"

export default function FacturasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
          <p className="text-muted-foreground">Gestiona las facturas de proveedores</p>
        </div>
        <CrearButton modulo="facturas" href="/facturas/nueva" label="Nueva Factura" />
      </div>

      <FacturasList />
    </div>
  )
}
