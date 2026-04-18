'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from '@/lib/schemas/template'
import type { Json, Template } from '@/types/database'

function toJson<T>(value: T): Json {
  return value as unknown as Json
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  const parsed = CreateTemplateSchema.parse(input)
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('templates')
    .insert({
      workspace_id: parsed.workspace_id,
      name: parsed.name,
      description: parsed.description ?? null,
      system_prompt: parsed.system_prompt ?? null,
      fields: toJson(parsed.fields),
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/${parsed.workspace_id}`)
  return data
}

export async function updateTemplate(input: UpdateTemplateInput): Promise<Template> {
  const parsed = UpdateTemplateSchema.parse(input)
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const payload: {
    name?: string
    description?: string | null
    system_prompt?: string | null
    fields?: Json
    updated_at: string
  } = { updated_at: new Date().toISOString() }

  if (parsed.name !== undefined) payload.name = parsed.name
  if (parsed.description !== undefined) payload.description = parsed.description ?? null
  if (parsed.system_prompt !== undefined) payload.system_prompt = parsed.system_prompt ?? null
  if (parsed.fields !== undefined) payload.fields = toJson(parsed.fields)

  const { data, error } = await supabase
    .from('templates')
    .update(payload)
    .eq('id', parsed.id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  if (parsed.workspace_id) revalidatePath(`/${parsed.workspace_id}`)
  return data
}

export async function deleteTemplate(input: { id: string; workspaceId: string }): Promise<void> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('templates').delete().eq('id', input.id)
  if (error) throw new Error(error.message)
  revalidatePath(`/${input.workspaceId}`)
}
