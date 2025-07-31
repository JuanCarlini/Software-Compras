"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { Loader2 } from "lucide-react"
import { Proveedor, CreateProveedorData, UpdateProveedorData } from "@/models"
import { ProveedorController } from "@/controllers"

const proveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  rut: z.string().min(1, "El RUT es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  pais: z.string().min(1, "El país es requerido"),
  contacto_principal: z.string().min(1, "El contacto principal es requerido"),
  sitio_web: z.string().url("URL inválida").optional().or(z.literal("")),
  notas: z.string().optional()
})

type FormData = z.infer<typeof proveedorSchema>

interface Props {
  proveedor?: Proveedor
  isEditing?: boolean
}

export function ProveedorForm({ proveedor, isEditing = false }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: proveedor?.nombre || "",
      rut: proveedor?.rut || "",
      email: proveedor?.email || "",
      telefono: proveedor?.telefono || "",
      direccion: proveedor?.direccion || "",
      ciudad: proveedor?.ciudad || "",
      pais: proveedor?.pais || "Argentina",
      contacto_principal: proveedor?.contacto_principal || "",
      sitio_web: proveedor?.sitio_web || "",
      notas: proveedor?.notas || ""
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Limpiar sitio_web si está vacío
      const cleanData = {
        ...data,
        sitio_web: data.sitio_web?.trim() || undefined
      }

      if (isEditing && proveedor) {
        const updateData: UpdateProveedorData = cleanData
        await ProveedorController.update(proveedor.id, updateData)
        router.push(`/proveedores/${proveedor.id}`)
      } else {
        const createData: CreateProveedorData = cleanData as CreateProveedorData
        const newProveedor = await ProveedorController.create(createData)
        router.push(`/proveedores/${newProveedor.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el proveedor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                <Input
                  id="nombre"
                  {...form.register("nombre")}
                  placeholder="ABC Corporation"
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-red-600">{form.formState.errors.nombre.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  {...form.register("rut")}
                  placeholder="12345678-9"
                />
                {form.formState.errors.rut && (
                  <p className="text-sm text-red-600">{form.formState.errors.rut.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="contacto@empresa.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  {...form.register("telefono")}
                  placeholder="+54 11 1234-5678"
                />
                {form.formState.errors.telefono && (
                  <p className="text-sm text-red-600">{form.formState.errors.telefono.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto_principal">Contacto Principal *</Label>
                <Input
                  id="contacto_principal"
                  {...form.register("contacto_principal")}
                  placeholder="Juan Pérez"
                />
                {form.formState.errors.contacto_principal && (
                  <p className="text-sm text-red-600">{form.formState.errors.contacto_principal.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sitio_web">Sitio Web</Label>
                <Input
                  id="sitio_web"
                  type="url"
                  {...form.register("sitio_web")}
                  placeholder="https://empresa.com"
                />
                {form.formState.errors.sitio_web && (
                  <p className="text-sm text-red-600">{form.formState.errors.sitio_web.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Ubicación */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  {...form.register("direccion")}
                  placeholder="Av. Corrientes 1234"
                />
                {form.formState.errors.direccion && (
                  <p className="text-sm text-red-600">{form.formState.errors.direccion.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  {...form.register("ciudad")}
                  placeholder="Buenos Aires"
                />
                {form.formState.errors.ciudad && (
                  <p className="text-sm text-red-600">{form.formState.errors.ciudad.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pais">País *</Label>
                <Select 
                  value={form.watch("pais")} 
                  onValueChange={(value) => form.setValue("pais", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Bolivia">Bolivia</SelectItem>
                    <SelectItem value="Perú">Perú</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Ecuador">Ecuador</SelectItem>
                    <SelectItem value="Venezuela">Venezuela</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.pais && (
                  <p className="text-sm text-red-600">{form.formState.errors.pais.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Información Adicional</h3>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                {...form.register("notas")}
                placeholder="Notas adicionales sobre el proveedor..."
                rows={4}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Guardando..." : (isEditing ? "Actualizar Proveedor" : "Crear Proveedor")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/proveedores")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
