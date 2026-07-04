import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No se envió ningún archivo" },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      )
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen debe ser menor a 2MB" },
        { status: 400 }
      )
    }

    const logoUrl = await ConfiguracionController.uploadLogo(file)
    
    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error("Error uploading logo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
