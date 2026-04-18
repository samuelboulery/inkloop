import { createServerClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error) return null
  return data
}
