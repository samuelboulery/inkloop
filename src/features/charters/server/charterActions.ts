'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { UpsertCharterSchema, type UpsertCharterInput } from '@/lib/schemas/charter'
import type { EditorialCharter, Json } from '@/types/database'

function toJson<T>(value: T): Json {
  return value as unknown as Json
}

export async function upsertCharter(input: UpsertCharterInput): Promise<EditorialCharter> {
  const parsed = UpsertCharterSchema.parse(input)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: existing, error: fetchError } = await supabase
    .from('editorial_charters')
    .select('id')
    .eq('workspace_id', parsed.workspace_id)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)

  if (existing) {
    const { data, error } = await supabase
      .from('editorial_charters')
      .update({
        tone_guidelines: parsed.tone_guidelines ?? null,
        vocabulary_rules: toJson(parsed.vocabulary_rules),
        content_rules: toJson(parsed.content_rules),
        brand_guidelines: parsed.brand_guidelines ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    revalidatePath(`/${parsed.workspace_id}`)
    return data
  }

  const { data, error } = await supabase
    .from('editorial_charters')
    .insert({
      workspace_id: parsed.workspace_id,
      tone_guidelines: parsed.tone_guidelines ?? null,
      vocabulary_rules: toJson(parsed.vocabulary_rules),
      content_rules: toJson(parsed.content_rules),
      brand_guidelines: parsed.brand_guidelines ?? null,
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/${parsed.workspace_id}`)
  return data
}
