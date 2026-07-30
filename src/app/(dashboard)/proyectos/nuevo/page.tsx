import { ProyectoForm } from "@/views/proyecto-form"
import { requirePagePermission } from "@/lib/auth/permissions-server"

export default async function NuevoProyectoPage() {
  await requirePagePermission("proyectos", "crear", "/proyectos")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Proyecto</h1>
        <p className="text-muted-foreground">Registra un proyecto para imputar órdenes de compra</p>
      </div>

      <ProyectoForm />
    </div>
  )
}
