import { OrdenPagoDetails } from "@/views/orden-pago-details"
import { Button } from "@/views/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Props {
  params: { id: string }
}

export default function OrdenPagoDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/ordenes-pago">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Orden de Pago #{params.id}
          </h1>
          <p className="text-slate-600">Detalles de la orden de pago</p>
        </div>
      </div>
      <OrdenPagoDetails id={params.id} />
    </div>
  )
}
