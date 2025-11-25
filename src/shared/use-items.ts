import { useState, useCallback } from "react"
import { Item } from "@/models"

interface UseItemsReturn {
  items: Item[]
  isLoading: boolean
  error: string | null
  loadItems: () => Promise<void>
  searchItems: (query: string) => Promise<void>
  createItem: (data: Partial<Item>) => Promise<Item | null>
  getItemById: (id: number) => Promise<Item | null>
}

export function useItems(): UseItemsReturn {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/items")
      if (!response.ok) {
        throw new Error("Error al cargar items")
      }
      const data = await response.json()
      setItems(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error al cargar items:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const searchItems = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      await loadItems()
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/items/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Error al buscar items")
      }
      const data = await response.json()
      setItems(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error al buscar items:", err)
    } finally {
      setIsLoading(false)
    }
  }, [loadItems])

  const createItem = useCallback(async (data: Partial<Item>): Promise<Item | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear item")
      }

      const newItem = await response.json()
      
      // Agregar el nuevo item a la lista
      setItems((prev) => [...prev, newItem])
      
      return newItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error al crear item:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getItemById = useCallback(async (id: number): Promise<Item | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/items/${id}`)
      if (!response.ok) {
        throw new Error("Item no encontrado")
      }
      const item = await response.json()
      return item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error al obtener item:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    items,
    isLoading,
    error,
    loadItems,
    searchItems,
    createItem,
    getItemById,
  }
}
