import { OrdenCompraForm } from "@/views/orden-compra-form"
import { Button } from "@/views/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NuevaOrdenCompraPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/ordenes-compra">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nueva Orden de Compra</h1>
          <p className="text-slate-600">Crear una nueva orden de compra</p>
        </div>
      </div>
      <OrdenCompraForm />
    </div>
  )
}
