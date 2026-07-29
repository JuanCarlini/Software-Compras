"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { TablaReporte } from "@/lib/export/tipos"

export interface ResultadoReporte {
  titulo: string
  filtros: Record<string, unknown>
  tablas: TablaReporte[]
}

// Cancela la petición anterior al cambiar un filtro: sin esto una respuesta lenta pisa
// a una posterior y la pantalla muestra números que no son los del filtro visible.
export function useReporte(nombre: string) {
  const searchParams = useSearchParams()
  const query = searchParams.toString()

  const [resultado, setResultado] = useState<ResultadoReporte | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const control = new AbortController()

    async function traer() {
      setCargando(true)
      try {
        const res = await fetch(`/api/reportes/${nombre}?${query}`, { signal: control.signal })
        if (!res.ok) {
          const cuerpo = await res.json().catch(() => ({}))
          throw new Error(cuerpo.error ?? `Error ${res.status}`)
        }
        setResultado(await res.json())
        setError(null)
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        // Se conserva el resultado anterior a propósito: vaciar la pantalla ante un
        // fallo de red descarta lo que el usuario estaba leyendo.
        setError(e instanceof Error ? e.message : "Error desconocido")
      } finally {
        if (!control.signal.aborted) setCargando(false)
      }
    }

    traer()
    return () => control.abort()
  }, [nombre, query])

  return { resultado, cargando, error }
}
