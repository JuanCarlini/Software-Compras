import { CertificacionesList } from "@/views/certificaciones-list"
import { Button } from "@/views/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function CertificacionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certificaciones</h1>
          <p className="text-muted-foreground">Gestiona las certificaciones de proyectos</p>
        </div>
        <Button asChild>
          <Link href="/certificaciones/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Certificación
          </Link>
        </Button>
      </div>

      <CertificacionesList />
    </div>
  )
}
