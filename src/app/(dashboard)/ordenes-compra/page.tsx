import { OrdenCompraList } from "@/views/orden-compra-list"
import { Button } from "@/views/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function OrdenesCompraPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Órdenes de Compra</h1>
          <p className="text-slate-600">Gestiona las órdenes de compra</p>
        </div>
        <Button asChild>
          <Link href="/ordenes-compra/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Link>
        </Button>
      </div>
      <OrdenCompraList />
    </div>
  )
}
