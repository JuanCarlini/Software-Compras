import { DashboardOverview } from "@/views/dashboard-overview"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Resumen general del sistema</p>
      </div>
      <DashboardOverview />
    </div>
  )
}
