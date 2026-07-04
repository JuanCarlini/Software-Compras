import { Button } from "@/views/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProveedorList } from "@/views/proveedor-list"

export default function ProveedoresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-slate-600">Gestiona los proveedores de tu empresa</p>
        </div>
        <Button asChild>
          <Link href="/proveedores/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>
      
      <ProveedorList />
    </div>
  )
}
