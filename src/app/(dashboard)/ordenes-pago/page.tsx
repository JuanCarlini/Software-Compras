import { OrdenPagoList } from "@/views/orden-pago-list"
import { Button } from "@/views/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function OrdenesPagoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Órdenes de Pago</h1>
          <p className="text-slate-600">Gestiona las órdenes de pago a proveedores</p>
        </div>
        <Button asChild>
          <Link href="/ordenes-pago/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden de Pago
          </Link>
        </Button>
      </div>
      <OrdenPagoList />
    </div>
  )
}
