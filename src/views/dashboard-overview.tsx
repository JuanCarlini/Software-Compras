"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { 
  ShoppingCart, 
  CreditCard, 
  Building2, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useDashboard } from "@/shared/use-dashboard"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { showSuccessToast, showInfoToast, showWarningToast, showErrorToast } from "@/shared/toast-helpers"

const getEstadoBadge = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'pendiente':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
    case 'aprobada':
    case 'aprobado':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Aprobada</Badge>
    case 'pagada':
    case 'pagado':
      return <Badge variant="outline" className="bg-green-100 text-green-800">Pagada</Badge>
    case 'rechazada':
    case 'rechazado':
      return <Badge variant="outline" className="bg-red-100 text-red-800">Rechazada</Badge>
    case 'activo':
      return <Badge variant="outline" className="bg-green-100 text-green-800">Activo</Badge>
    default:
      return <Badge variant="outline">{estado}</Badge>
  }
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'orden_compra':
      return <ShoppingCart className="h-4 w-4 text-blue-600" />
    case 'orden_pago':
      return <CreditCard className="h-4 w-4 text-green-600" />
    case 'proveedor':
      return <Building2 className="h-4 w-4 text-purple-600" />
    default:
      return <div className="h-4 w-4" />
  }
}

export function DashboardOverview() {
  const { stats, loading, error, refreshData } = useDashboard()

  const handleTestNotification = (type: string) => {
    switch (type) {
      case 'success':
        showSuccessToast("¡Operación completada!", "La acción se ejecutó correctamente")
        break
      case 'info':
        showInfoToast("Información del sistema", "Datos del dashboard actualizados")
        break
      case 'warning':
        showWarningToast("Atención requerida", `Hay ${stats?.ordenesPago.vencidas || 0} órdenes vencidas`)
        break
      case 'error':
        showErrorToast("Error en el sistema", "Error de prueba del sistema de notificaciones")
        break
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-slate-500">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  const statsCards = [
    {
      title: "Órdenes de Compra",
      value: stats.ordenesCompra.total.toString(),
      change: `${stats.ordenesCompra.recientes} nueva${stats.ordenesCompra.recientes !== 1 ? 's' : ''} esta semana`,
      icon: ShoppingCart,
      color: "text-blue-600",
      details: `${stats.ordenesCompra.pendientes} pendientes, ${stats.ordenesCompra.aprobadas} aprobadas`
    },
    {
      title: "Órdenes de Pago",
      value: stats.ordenesPago.total.toString(),
      change: `${stats.ordenesPago.vencidas} vencida${stats.ordenesPago.vencidas !== 1 ? 's' : ''}`,
      icon: CreditCard,
      color: stats.ordenesPago.vencidas > 0 ? "text-red-600" : "text-green-600",
      details: `${stats.ordenesPago.pendientes} pendientes, ${stats.ordenesPago.aprobadas} aprobadas`
    },
    {
      title: "Proveedores",
      value: stats.proveedores.total.toString(),
      change: `${stats.proveedores.activos} activos`,
      icon: Building2,
      color: "text-purple-600",
      details: `${stats.proveedores.nuevos} nuevo${stats.proveedores.nuevos !== 1 ? 's' : ''} este mes`
    },
    {
      title: "Total Pagado",
      value: formatCurrency(stats.ordenesPago.montoTotal, "ARS"),
      change: "Órdenes completadas",
      icon: TrendingUp,
      color: "text-orange-600",
      details: "Monto total de pagos realizados"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Botones de prueba de notificaciones y refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🔔 Prueba de Notificaciones</CardTitle>
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleTestNotification('success')}
            >
              ✅ Éxito
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleTestNotification('info')}
            >
              ℹ️ Info
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTestNotification('warning')}
            >
              ⚠️ Alerta
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleTestNotification('error')}
            >
              ❌ Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
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
                <p className="text-xs text-slate-400 mt-1">{stat.details}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.actividadReciente.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay actividad reciente</p>
              ) : (
                stats.actividadReciente.slice(0, 5).map((actividad) => (
                  <div key={`${actividad.tipo}-${actividad.id}`} className="flex items-center space-x-3">
                    {getTipoIcon(actividad.tipo)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">{actividad.descripcion}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-slate-500">{formatDateShort(actividad.fecha)}</p>
                        {actividad.estado && getEstadoBadge(actividad.estado)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Órdenes que Requieren Atención */}
        <Card>
          <CardHeader>
            <CardTitle>Requieren Atención</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Órdenes de pago vencidas */}
              {stats.ordenesPago.vencidas > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Órdenes Vencidas</p>
                      <p className="text-xs text-red-600">{stats.ordenesPago.vencidas} órdenes de pago vencidas</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    Urgente
                  </Badge>
                </div>
              )}

              {/* Órdenes pendientes */}
              {stats.ordenesCompra.pendientes > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Órdenes Pendientes</p>
                      <p className="text-xs text-yellow-600">{stats.ordenesCompra.pendientes} órdenes de compra por aprobar</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Pendiente
                  </Badge>
                </div>
              )}

              {/* Si todo está bien */}
              {stats.ordenesPago.vencidas === 0 && stats.ordenesCompra.pendientes === 0 && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Todo al día</p>
                    <p className="text-xs text-green-600">No hay elementos que requieran atención inmediata</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
