'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { EditorialCharter } from '@/types/database'

export async function getCharter(workspaceId: string): Promise<EditorialCharter | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('editorial_charters')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
