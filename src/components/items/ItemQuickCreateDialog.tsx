"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { CreateItemSchema, CreateItemFormData } from "@/shared/item-validation"
import { Item, ItemCategoria, UnidadMedida } from "@/models"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/views/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/views/ui/form"
import { Input } from "@/views/ui/input"
import { Textarea } from "@/views/ui/textarea"
import { Button } from "@/views/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/views/ui/select"
import { useToast } from "@/shared/use-toast"

interface ItemQuickCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemCreated?: (item: Item) => void
  userId?: number | null
}

export function ItemQuickCreateDialog({
  open,
  onOpenChange,
  onItemCreated,
  userId,
}: ItemQuickCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateItemFormData>({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: {
      nombre: "",
      descripcion: null,
      precio_sugerido: undefined,
      unidad_medida: null,
      categoria: null,
      created_by: userId || undefined,
    },
  })

  const onSubmit = async (data: CreateItemFormData) => {
    setIsLoading(true)

    try {
      // Preparar datos sin created_by si no hay usuario
      const payload = {
        ...data,
        created_by: userId || undefined
      }
      
      // Eliminar created_by si es undefined
      if (!payload.created_by) {
        delete payload.created_by
      }

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorMessage = "Error al crear el item"
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto
          const text = await response.text()
          errorMessage = text || `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const nuevoItem = await response.json() as Item

      toast({
        title: "Item creado",
        description: `"${nuevoItem.nombre}" se ha creado exitosamente`,
      })

      // Cerrar el dialog y notificar
      form.reset({
        nombre: "",
        descripcion: null,
        precio_sugerido: undefined,
        unidad_medida: null,
        categoria: null,
        created_by: userId || undefined,
      })
      onOpenChange(false)
      onItemCreated?.(nuevoItem)
    } catch (error) {
      console.error("Error al crear item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Item</DialogTitle>
          <DialogDescription>
            Agrega un nuevo producto o servicio al catálogo para usar en órdenes de compra.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Cemento Portland"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales del item..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Opcional: Información adicional sobre el producto o servicio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Precio Sugerido y Unidad de Medida en la misma fila */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precio_sugerido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Sugerido</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidad_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ninguna" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UnidadMedida).map((unidad) => (
                          <SelectItem key={unidad} value={unidad}>
                            {unidad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categoría */}
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguna" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ItemCategoria).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Ayuda a organizar el catálogo de items
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
