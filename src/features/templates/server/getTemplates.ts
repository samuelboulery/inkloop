'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { Template } from '@/types/database'

export async function getTemplates(workspaceId: string): Promise<Template[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  if (error) throw error
  return data
}
