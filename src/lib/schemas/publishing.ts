import { z } from 'zod'
import { GeneratedPostSchema } from './campaign'

export const PublishWebhookPayloadSchema = z.object({
  campaign_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  platforms: z.array(z.string()).min(1),
  content: z.record(z.string(), GeneratedPostSchema),
  scheduled_for: z.string().datetime().nullable(),
})

export const N8nConfirmationSchema = z.object({
  event_id: z.string().uuid(),
  status: z.enum(['delivered', 'failed']),
  published_at: z.string().datetime().optional(),
  response_status: z.number().int().optional(),
  response_body: z.string().optional(),
})

export const PublishCampaignInputSchema = z.object({
  campaignId: z.string().uuid(),
  scheduledFor: z.string().datetime().nullable(),
})

export type PublishWebhookPayload = z.infer<typeof PublishWebhookPayloadSchema>
export type N8nConfirmation = z.infer<typeof N8nConfirmationSchema>
export type PublishCampaignInput = z.infer<typeof PublishCampaignInputSchema>
