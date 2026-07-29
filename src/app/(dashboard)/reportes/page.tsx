import { requirePagePermission } from "@/lib/auth/permissions-server"
import { ReportesShell } from "@/views/reportes/reportes-shell"
import { ProveedorService } from "@/services/proveedor.service"
import { ProyectoService } from "@/services/proyecto.service"

// Guarda en el servidor: el redireccionamiento ocurre antes de enviar HTML, igual
// que en el resto de las paginas del dashboard.
export default async function ReportesPage() {
  await requirePagePermission("reportes", "ver")

  const [proveedores, proyectos] = await Promise.all([
    ProveedorService.getAll(),
    ProyectoService.getAll(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Indicadores del circuito de compras</p>
      </div>
      <ReportesShell
        proveedores={proveedores.map((p) => ({ id: p.id, nombre: p.nombre }))}
        proyectos={proyectos.map((p) => ({ id: p.id, nombre: p.nombre }))}
      />
    </div>
  )
}
