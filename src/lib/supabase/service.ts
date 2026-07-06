import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente de datos SERVER-ONLY con service_role (bypasea RLS).
// Es la única puerta legítima a la base desde que RLS niega todo al rol anon:
// el browser nunca habla con Supabase directamente, siempre vía API routes.
// SUPABASE_SERVICE_ROLE_KEY no tiene prefijo NEXT_PUBLIC_ → nunca llega al bundle;
// si este módulo se importara desde un componente client, el fail-fast lo delata.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada.')
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. Copiala del dashboard de Supabase (Settings → API) a .env.local.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
