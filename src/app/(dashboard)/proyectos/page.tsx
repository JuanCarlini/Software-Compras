import { ProyectoList } from "@/views/proyecto-list"
import { CrearButton } from "@/components/crear-button"
import { requirePagePermission } from "@/lib/auth/permissions-server"

export default async function ProyectosPage() {
  await requirePagePermission("proyectos", "ver")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">
            Obras y centros de costo a los que se imputan las órdenes de compra
          </p>
        </div>
        <CrearButton modulo="proyectos" href="/proyectos/nuevo" label="Nuevo Proyecto" />
      </div>

      <ProyectoList />
    </div>
  )
}
