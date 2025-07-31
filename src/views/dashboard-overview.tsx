import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { ShoppingCart, CreditCard, Building2, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Órdenes de Compra",
    value: "12",
    change: "+2 esta semana",
    icon: ShoppingCart,
    color: "text-blue-600"
  },
  {
    title: "Órdenes de Pago",
    value: "8",
    change: "+1 esta semana", 
    icon: CreditCard,
    color: "text-green-600"
  },
  {
    title: "Proveedores Activos",
    value: "24",
    change: "+3 este mes",
    icon: Building2,
    color: "text-purple-600"
  },
  {
    title: "Total Facturado",
    value: "$45,231",
    change: "+12% este mes",
    icon: TrendingUp,
    color: "text-orange-600"
  }
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">Nueva orden de compra #001</p>
                  <p className="text-xs text-slate-500">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">Orden #002 aprobada</p>
                  <p className="text-xs text-slate-500">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">Nuevo proveedor registrado</p>
                  <p className="text-xs text-slate-500">Hace 1 día</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Orden #003</p>
                  <p className="text-xs text-slate-500">Proveedor: ABC Corp</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Pendiente
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Orden #004</p>
                  <p className="text-xs text-slate-500">Proveedor: XYZ Ltd</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  En revisión
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
