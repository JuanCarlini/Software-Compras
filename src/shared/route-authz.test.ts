import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, relative, sep } from "node:path"

// REGLA DURA (enforced): toda ruta de API con un método MUTANTE (POST/PUT/PATCH/DELETE)
// DEBE referenciar un gate de autorización. Si alguien agrega una ruta mutante sin gate,
// este test falla y rompe el build/CI — el hueco no llega a producción.

const API_DIR = join(process.cwd(), "src", "app", "api")

function routeFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...routeFiles(full))
    else if (entry.name === "route.ts") out.push(full)
  }
  return out
}

// Rutas públicas / self-action que legítimamente NO llevan gate de permiso:
// login es público; logout/change-password solo requieren estar autenticado (el
// usuario opera sobre su propia sesión/clave). El middleware ya exige auth en todas.
const ALLOWLIST = [
  "auth/login/route.ts",
  "auth/logout/route.ts",
  "auth/change-password/route.ts",
].map((p) => p.split("/").join(sep))

// Un gate válido: la matriz (requirePermission), un grupo de rol (requireRole),
// admin (requireAdmin), o las route-factories que llevan `autorizar` adentro.
const GATE = /requirePermission|requireRole|requireAdmin|createRoute|estadoRoute/
const MUTATING = /export\s+(async\s+function|const)\s+(POST|PUT|PATCH|DELETE)\b/

const files = routeFiles(API_DIR).map((f) => [relative(API_DIR, f), f] as const)

describe("regla dura de seguridad: toda ruta mutante tiene gate de autorización", () => {
  it("encontró rutas para escanear", () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it.each(files)("%s", (rel, full) => {
    if (ALLOWLIST.includes(rel)) return
    const src = readFileSync(full, "utf8")
    if (MUTATING.test(src)) {
      expect(src, `${rel}: tiene un método mutante (POST/PUT/PATCH/DELETE) sin gate de autorización`).toMatch(GATE)
    }
  })
})
