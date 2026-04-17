import { z } from 'zod'

export const CampaignStatusSchema = z.enum(['Draft', 'InProgress', 'Ready', 'Sent'])

export const ClarificationQASchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.enum(['tone', 'structure', 'audience', 'other']).default('other'),
})

export const EditorialSkeletonSchema = z.object({
  angle: z.string(),
  key_messages: z.array(z.string()),
  content_type: z.string(),
  tone: z.string().optional(),
})

export const GeneratedPostSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()).default([]),
  image_url: z.string().url().optional().nullable(),
  platform: z.string(),
})

export const CreateCampaignSchema = z.object({
  workspace_id: z.string().uuid(),
  template_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  raw_data: z.record(z.string(), z.unknown()).default({}),
})

export const UpdateCampaignSchema = z.object({
  id: z.string().uuid(),
  status: CampaignStatusSchema.optional(),
  raw_data: z.record(z.string(), z.unknown()).optional(),
  ai_clarification_questions: z.array(ClarificationQASchema).optional(),
  editorial_skeleton: EditorialSkeletonSchema.optional().nullable(),
  skeleton_approved_by_user: z.boolean().optional(),
  generated_content: z.record(z.string(), GeneratedPostSchema).optional(),
  final_edits: z.record(z.string(), GeneratedPostSchema.partial()).optional(),
  sent_at: z.string().datetime().optional().nullable(),
})

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>
export type ClarificationQA = z.infer<typeof ClarificationQASchema>
export type EditorialSkeleton = z.infer<typeof EditorialSkeletonSchema>
export type GeneratedPost = z.infer<typeof GeneratedPostSchema>
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>
