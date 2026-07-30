"use client"

import { useCallback, useEffect, useState } from "react"
import type { Proyecto } from "@/models/proyecto.model"

export function useProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProyectos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/proyectos")
      if (!res.ok) {
        const cuerpo = await res.json().catch(() => ({}))
        throw new Error(cuerpo.error ?? `Error ${res.status}`)
      }
      setProyectos(await res.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProyectos()
  }, [refreshProyectos])

  return { proyectos, loading, error, refreshProyectos }
}
