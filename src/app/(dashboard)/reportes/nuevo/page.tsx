import { ReporteForm } from "@/views/reporte-form"

export default function NuevoReportePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Generar Nuevo Reporte</h1>
        <p className="text-slate-600">Configura los parámetros y genera un nuevo reporte del sistema</p>
      </div>
      
      <ReporteForm />
    </div>
  )
}
