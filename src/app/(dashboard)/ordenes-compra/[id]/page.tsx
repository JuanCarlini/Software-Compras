import { OrdenCompraDetails } from "@/views/orden-compra-details"
import { Button } from "@/views/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrdenCompraDetailPage({ params }: Props) {
  const { id } = await params
  
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
          <h1 className="text-3xl font-bold text-slate-900">Detalle de Orden de Compra</h1>
        </div>
      </div>
      
      <OrdenCompraDetails ordenId={id} />
    </div>
  )
}
