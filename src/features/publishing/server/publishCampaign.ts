'use server'

import { createServerClient } from '@/lib/supabase/server'
import {
  PublishCampaignInputSchema,
  PublishWebhookPayloadSchema,
  type PublishCampaignInput,
} from '@/lib/schemas/publishing'
import { GeneratedPostSchema, type GeneratedPost } from '@/lib/schemas/campaign'
import type { Json } from '@/types/database'
import { z } from 'zod'
import { checkAndRecordWebhookRateLimit } from './webhookRateLimit'

function toJson<T>(value: T): Json {
  return value as unknown as Json
}

function mergeEdits(
  content: Record<string, GeneratedPost>,
  edits: Record<string, Partial<GeneratedPost>>,
): Record<string, GeneratedPost> {
  const merged: Record<string, GeneratedPost> = {}
  for (const [platform, post] of Object.entries(content)) {
    const edit = edits[platform] ?? {}
    merged[platform] = GeneratedPostSchema.parse({
      ...post,
      ...edit,
      platform,
    })
  }
  return merged
}

export interface PublishResult {
  eventIds: string[]
  status: 'sent' | 'scheduled'
}

export async function publishCampaign(input: PublishCampaignInput): Promise<PublishResult> {
  const parsed = PublishCampaignInputSchema.parse(input)

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL non configurée')
  }

  const supabase = await createServerClient()

  const { data: campaign, error: loadError } = await supabase
    .from('campaigns')
    .select('id, workspace_id, status, generated_content, final_edits')
    .eq('id', parsed.campaignId)
    .single()

  if (loadError) throw loadError
  if (!campaign) throw new Error('Campagne introuvable')
  if (campaign.status !== 'Ready' && campaign.status !== 'InProgress') {
    throw new Error(`Campagne non publiable (statut : ${campaign.status})`)
  }

  const generated = z
    .record(z.string(), GeneratedPostSchema)
    .parse(campaign.generated_content ?? {})
  const edits = z
    .record(z.string(), GeneratedPostSchema.partial())
    .parse(campaign.final_edits ?? {})

  const finalContent = mergeEdits(generated, edits)
  const platforms = Object.keys(finalContent)
  if (platforms.length === 0) {
    throw new Error('Aucun contenu à publier')
  }

  const payload = PublishWebhookPayloadSchema.parse({
    campaign_id: campaign.id,
    workspace_id: campaign.workspace_id,
    platforms,
    content: finalContent,
    scheduled_for: parsed.scheduledFor,
  })

  await checkAndRecordWebhookRateLimit(supabase, campaign.workspace_id)

  const eventRows = platforms.map((platform) => ({
    workspace_id: campaign.workspace_id,
    campaign_id: campaign.id,
    platform,
    webhook_url: webhookUrl,
    webhook_payload: toJson({ ...payload, platforms: [platform] }),
    scheduled_for: parsed.scheduledFor,
  }))

  const { data: events, error: insertError } = await supabase
    .from('publishing_events')
    .insert(eventRows)
    .select('id, platform')

  if (insertError) throw insertError
  if (!events) throw new Error('Création des évènements de publication échouée')

  const secret = process.env.N8N_WEBHOOK_SECRET
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret) headers['x-webhook-secret'] = secret

  const body = JSON.stringify({ ...payload, event_ids: events.map((e) => e.id) })

  let responseStatus: number | null = null
  let responseBody: string | null = null
  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers, body })
    responseStatus = res.status
    responseBody = (await res.text()).slice(0, 4000)
    if (!res.ok) {
      throw new Error(`Webhook n8n a répondu ${res.status}`)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    await supabase
      .from('publishing_events')
      .update({ response_status: responseStatus ?? 0, response_body: responseBody ?? message })
      .in(
        'id',
        events.map((e) => e.id),
      )
    throw new Error(`Publication impossible : ${message}`)
  }

  await supabase
    .from('publishing_events')
    .update({ response_status: responseStatus, response_body: responseBody })
    .in(
      'id',
      events.map((e) => e.id),
    )

  const { error: campaignUpdateError } = await supabase
    .from('campaigns')
    .update({
      status: 'Sent',
      sent_at: parsed.scheduledFor ?? new Date().toISOString(),
    })
    .eq('id', campaign.id)

  if (campaignUpdateError) throw campaignUpdateError

  return {
    eventIds: events.map((e) => e.id),
    status: parsed.scheduledFor ? 'scheduled' : 'sent',
  }
}
