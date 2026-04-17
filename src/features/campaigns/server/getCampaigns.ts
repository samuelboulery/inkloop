'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'

export async function getCampaigns(workspaceId: string): Promise<Campaign[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
