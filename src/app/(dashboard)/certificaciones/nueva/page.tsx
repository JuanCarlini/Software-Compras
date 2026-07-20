"use client"

import { CertificacionForm } from "@/views/certificacion-form"

export default function NuevaCertificacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Certificación</h1>
        <p className="text-muted-foreground">Crea una nueva certificación de proyecto</p>
      </div>
      
      <CertificacionForm />
    </div>
  )
}
