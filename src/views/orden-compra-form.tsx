"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { Loader2, Plus, Trash2, ShoppingCart } from "lucide-react"
import { ProveedorService, OrdenCompraService } from "@/controllers"
import { Proveedor, Item } from "@/models"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"
import { formatCurrency } from "@/shared/format-utils"
import { ItemSelector } from "@/components/items"

interface ItemOrden {
  id: string
  item_id?: number | null  // NUEVO: ID del item del catálogo
  producto: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export function OrdenCompraForm() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loadingProveedores, setLoadingProveedores] = useState(true)

  // datos de la cabecera de la OC (los que sí existen en la tabla)
  const [formData, setFormData] = useState({
    proveedor_id: "",
    fecha_oc: new Date().toISOString().split("T")[0],
    moneda: "ARS",
    observaciones: "",
  })

  // items solo para el front, después los convertimos al formato de la tabla de líneas
  const [items, setItems] = useState<ItemOrden[]>([])
  const [nuevoItem, setNuevoItem] = useState({
    item_id: null as number | null,  // NUEVO: ID del item seleccionado
    producto: "",
    descripcion: "",
    cantidad: "1",
    precio_unitario: "",
  })
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)  // NUEVO: Item completo

  // ===== helpers de totales =====

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calcularImpuestos = () => {
    const subtotal = calcularSubtotal()
    return subtotal * 0.21 // 21% de IVA
  }

  const calcularTotal = () => {
    return calcularSubtotal() + calcularImpuestos()
  }

  // ===== cargar proveedores =====

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        setLoadingProveedores(true)
        const data = await ProveedorService.getAll()
        // en la base el estado es 'activo' / 'inactivo'
        const activos = data.filter((p) => (p.estado ?? "activo") === "activo")
        setProveedores(activos)
      } catch (err: any) {
        console.error("Error al cargar proveedores:", err)
        setError("No se pudieron cargar los proveedores")
      } finally {
        setLoadingProveedores(false)
      }
    }

    fetchProveedores()
  }, [])

  // ===== handlers =====

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNuevoItemChange = (field: string, value: string) => {
    setNuevoItem((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const agregarItem = () => {
    if (!nuevoItem.producto.trim()) {
      setError("El nombre del producto es requerido")
      return
    }

    const cantidad = parseFloat(nuevoItem.cantidad) || 0
    const precioUnitario = parseFloat(nuevoItem.precio_unitario) || 0

    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0")
      return
    }

    if (precioUnitario <= 0) {
      setError("El precio unitario debe ser mayor a 0")
      return
    }

    const subtotal = cantidad * precioUnitario

    const item: ItemOrden = {
      id: `temp-${Date.now()}`,
      item_id: nuevoItem.item_id,  // NUEVO: Guardar el item_id
      producto: nuevoItem.producto,
      descripcion: nuevoItem.descripcion,
      cantidad,
      precio_unitario: precioUnitario,
      subtotal,
    }

    setItems((prev) => [...prev, item])

    // Reset form
    setNuevoItem({
      item_id: null,  // NUEVO
      producto: "",
      descripcion: "",
      cantidad: "1",
      precio_unitario: "",
    })
    setSelectedItem(null)  // NUEVO

    setError(null)
  }

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // validaciones básicas
    if (!formData.proveedor_id) {
      setError("Por favor selecciona un proveedor")
      return
    }

    if (!formData.fecha_oc) {
      setError("Por favor selecciona una fecha de la orden")
      return
    }

    if (items.length === 0) {
      setError("Debes agregar al menos un item")
      return
    }

    try {
      setIsLoading(true)

      const total_neto = calcularSubtotal()
      const total_iva = calcularImpuestos()
      const total_con_iva = calcularTotal()

      // 1) crear cabecera en gu_ordenesdecompra
      const oc = await OrdenCompraService.create({
        numero_oc: `OC-${Date.now()}`,              // la tabla tiene numero_oc
        proveedor_id: Number(formData.proveedor_id),
        proyecto_id: null,                          // no lo estás pidiendo
        fecha_oc: formData.fecha_oc,                // la tabla es DATE
        moneda: formData.moneda as any,             // enum en la base
        total_neto,
        total_iva,
        total_con_iva,
        estado: "borrador",                         // default en la base
        observaciones: formData.observaciones || null,
      })

      // 2) crear líneas en gu_lineasdeordenesdecompra
      const lineas = items.map((item) => {
        const totalNeto = item.subtotal
        const iva = 21
        const totalConIva = totalNeto * (1 + iva / 100)

        return {
          orden_compra_id: oc.id,
          item_id: item.item_id || null,  // NUEVO: Incluir item_id si existe
          item_codigo: item.producto || null,
          // la columna descripcion es NOT NULL en la tabla, así que le mando algo sí o sí
          descripcion: item.descripcion || item.producto,
          cantidad: item.cantidad,
          precio_unitario_neto: item.precio_unitario,
          iva_porcentaje: iva,
          total_neto: totalNeto,
          total_con_iva: totalConIva,
          estado: "borrador",
        }
      })

      await OrdenCompraService.createLines(lineas)

      showSuccessToast("Orden de compra creada exitosamente")
      router.push("/ordenes-compra")
    } catch (err: any) {
      console.group("🧩 Error completo al crear orden")
      console.error("Objeto recibido:", err)
      console.error("message:", err?.message)
      console.error("details:", err?.details)
      console.error("hint:", err?.hint)
      console.groupEnd()

      const errorMessage = err?.message ?? "Error desconocido"
      setError(`Error al crear la orden de compra: ${errorMessage}`)
      showErrorToast("Error al crear la orden de compra", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Orden de Compra</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la OC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Proveedor</Label>
              <Select
                required
                disabled={loadingProveedores || isLoading}
                value={formData.proveedor_id}
                onValueChange={(value) => handleInputChange("proveedor_id", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingProveedores
                        ? "Cargando proveedores..."
                        : proveedores.length === 0
                        ? "No hay proveedores disponibles"
                        : "Selecciona un proveedor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay proveedores registrados
                    </SelectItem>
                  ) : (
                    proveedores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de la OC</Label>
              <Input
                type="date"
                value={formData.fecha_oc}
                onChange={(e) => handleInputChange("fecha_oc", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={formData.moneda}
                onValueChange={(value) => handleInputChange("moneda", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                rows={2}
                value={formData.observaciones}
                onChange={(e) => handleInputChange("observaciones", e.target.value)}
                disabled={isLoading}
                placeholder="Notas u observaciones internas..."
              />
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Items de la Orden
            </h3>

            {/* Form para agregar item */}
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Producto / Servicio *</Label>
                  <ItemSelector
                    value={nuevoItem.item_id}
                    onChange={(itemId, item) => {
                      setSelectedItem(item)
                      setNuevoItem((prev) => ({
                        ...prev,
                        item_id: itemId,
                        producto: item?.nombre || "",
                      }))
                    }}
                    onPriceAutoFill={(price) => {
                      if (price) {
                        setNuevoItem((prev) => ({
                          ...prev,
                          precio_unitario: price.toString(),
                        }))
                      }
                    }}
                    disabled={isLoading}
                    placeholder="Buscar o crear item..."
                  />
                  {selectedItem && selectedItem.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedItem.descripcion}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={(e) => handleNuevoItemChange("cantidad", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio Unit. *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoItem.precio_unitario}
                    onChange={(e) => handleNuevoItemChange("precio_unitario", e.target.value)}
                    disabled={isLoading}
                    placeholder="0.00"
                  />
                  {selectedItem?.precio_sugerido && (
                    <p className="text-xs text-muted-foreground">
                      Precio sugerido: ${selectedItem.precio_sugerido.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={agregarItem} disabled={isLoading} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <Label>Descripción del item (opcional)</Label>
                <Input
                  value={nuevoItem.descripcion}
                  onChange={(e) => handleNuevoItemChange("descripcion", e.target.value)}
                  disabled={isLoading}
                  placeholder="Detalles adicionales del producto"
                />
              </div>
            </div>

            {/* lista de items */}
            {items.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 rounded-t font-medium text-sm">
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-2 text-right">Cantidad</div>
                  <div className="col-span-2 text-right">P. Unitario</div>
                  <div className="col-span-3 text-right">Subtotal</div>
                  <div className="col-span-1" />
                </div>
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 border rounded hover:bg-slate-50">
                    <div className="col-span-4">
                      <p className="font-medium">{item.producto}</p>
                      {item.descripcion && <p className="text-sm text-slate-600">{item.descripcion}</p>}
                    </div>
                    <div className="col-span-2 text-right">{item.cantidad}</div>
                    <div className="col-span-2 text-right">{formatCurrency(item.precio_unitario)}</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(item.subtotal)}</div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarItem(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded">
                No hay items agregados. Usa el formulario de arriba para agregarlos.
              </div>
            )}
          </div>

          {/* Totales */}
          {items.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Neto:</span>
                  <span className="font-medium">{formatCurrency(calcularSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (21%):</span>
                  <span className="font-medium">{formatCurrency(calcularImpuestos())}</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-lg font-bold">
                  <span>Total con IVA:</span>
                  <span className="text-green-600">{formatCurrency(calcularTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* acciones */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading || loadingProveedores}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Creando..." : "Crear Orden"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/ordenes-compra")} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
