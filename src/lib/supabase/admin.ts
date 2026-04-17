import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Client Supabase avec service role. À utiliser UNIQUEMENT côté serveur
 * (API routes, webhooks externes) quand il n'y a pas de session utilisateur.
 * Ne jamais importer ce fichier depuis un Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL non configurée')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurée')

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
