"use client"

import { CertificacionForm } from "@/views/certificacion-form"

export default function NuevaCertificacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nueva Certificación</h1>
        <p className="text-slate-600">Crea una nueva certificación de proyecto</p>
      </div>
      
      <CertificacionForm />
    </div>
  )
}
