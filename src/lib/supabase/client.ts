import { createBrowserClient } from '@supabase/ssr'

// ponytail: cliente sin tipar — el types.ts anterior describía un schema inexistente (pre gu_*).
// Upgrade path: regenerar tipos reales con `supabase gen types typescript` y reponer el genérico.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
