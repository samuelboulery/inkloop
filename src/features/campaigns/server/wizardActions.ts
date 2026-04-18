'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { ClarificationQA, EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import type { Campaign, Json } from '@/types/database'

function toJson<T>(value: T): Json {
  return value as unknown as Json
}

export async function initializeCampaign(input: {
  workspaceId: string
  templateId: string
  name: string
  rawData: Record<string, unknown>
}): Promise<string> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      workspace_id: input.workspaceId,
      template_id: input.templateId,
      name: input.name,
      raw_data: toJson(input.rawData),
      status: 'Draft',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function saveCampaignObjectives(input: {
  campaignId: string
  rawData: Record<string, unknown>
}): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('campaigns')
    .update({
      raw_data: toJson(input.rawData),
    })
    .eq('id', input.campaignId)

  if (error) throw error
}

export async function saveClarificationAnswers(input: {
  campaignId: string
  qa: ClarificationQA[]
}): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('campaigns')
    .update({
      ai_clarification_questions: input.qa,
      status: 'InProgress',
    })
    .eq('id', input.campaignId)

  if (error) throw error
}

export async function approveSkeleton(input: {
  campaignId: string
  skeleton: EditorialSkeleton
}): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('campaigns')
    .update({
      editorial_skeleton: toJson(input.skeleton),
      skeleton_approved_by_user: true,
    })
    .eq('id', input.campaignId)

  if (error) throw error
}

export async function saveGeneratedContent(input: {
  campaignId: string
  content: Record<string, GeneratedPost>
  finalEdits: Record<string, Partial<GeneratedPost>>
}): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('campaigns')
    .update({
      generated_content: toJson(input.content),
      final_edits: toJson(input.finalEdits),
      status: 'Ready',
    })
    .eq('id', input.campaignId)

  if (error) throw error
}

export async function updateCampaignContent(input: {
  campaignId: string
  content: Record<string, GeneratedPost>
  newStatus: Campaign['status']
}): Promise<Campaign> {
  if (input.newStatus === 'Sent') {
    throw new Error('Impossible de modifier une campagne déjà envoyée')
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      generated_content: toJson(input.content),
      status: input.newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.campaignId)
    .select()
    .single()

  if (error) throw error
  return data
}
