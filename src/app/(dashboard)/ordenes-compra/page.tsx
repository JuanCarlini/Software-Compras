import { OrdenCompraList } from "@/views/orden-compra-list"
import { CrearButton } from "@/views/crear-button"

export default function OrdenesCompraPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Órdenes de Compra</h1>
          <p className="text-muted-foreground">Gestiona las órdenes de compra</p>
        </div>
        <CrearButton modulo="ordenes_compra" href="/ordenes-compra/nueva" label="Nueva Orden" />
      </div>
      <OrdenCompraList />
    </div>
  )
}
