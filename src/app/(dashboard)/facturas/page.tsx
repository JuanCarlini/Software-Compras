import { FacturasList } from "@/views/facturas-list"
import { Button } from "@/views/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function FacturasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
          <p className="text-muted-foreground">Gestiona las facturas de proveedores</p>
        </div>
        <Button asChild>
          <Link href="/facturas/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Link>
        </Button>
      </div>

      <FacturasList />
    </div>
  )
}
