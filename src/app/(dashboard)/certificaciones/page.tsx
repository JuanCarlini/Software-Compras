"use client"

import { CertificacionesList } from "@/views/certificaciones-list"

export default function CertificacionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Certificaciones</h1>
          <p className="text-slate-600">Gestiona las certificaciones de proyectos</p>
        </div>
      </div>
      
      <CertificacionesList />
    </div>
  )
}
