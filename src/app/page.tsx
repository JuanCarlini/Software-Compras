import { redirect } from "next/navigation"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function HomePage() {
  // Redirigir al login por defecto
  redirect("/login")
}
