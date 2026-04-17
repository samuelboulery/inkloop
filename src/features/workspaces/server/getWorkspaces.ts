'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { Workspace } from '@/types/database'

export async function getWorkspaces(): Promise<Workspace[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
