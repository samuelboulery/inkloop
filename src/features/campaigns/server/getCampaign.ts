'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'

export async function getCampaign(
  campaignId: string,
  workspaceId: string,
): Promise<Campaign | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error) return null
  return data
}
