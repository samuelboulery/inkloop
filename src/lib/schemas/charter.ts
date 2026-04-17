import { z } from 'zod'

export const VocabularyRulesSchema = z.object({
  forbidden: z.array(z.string()).default([]),
  preferred: z.record(z.string(), z.array(z.string())).default({}),
})

export const ContentRulesSchema = z.object({
  min_length: z.number().int().positive().optional(),
  max_length: z.number().int().positive().optional(),
  allowed_topics: z.array(z.string()).default([]),
  forbidden_topics: z.array(z.string()).default([]),
})

export const PlatformRulesSchema = z.record(z.string(), ContentRulesSchema)

export const UpsertCharterSchema = z.object({
  workspace_id: z.string().uuid(),
  tone_guidelines: z.string().optional().nullable(),
  vocabulary_rules: VocabularyRulesSchema.default({ forbidden: [], preferred: {} }),
  content_rules: ContentRulesSchema.default({ allowed_topics: [], forbidden_topics: [] }),
  brand_guidelines: z.string().optional().nullable(),
})

export type VocabularyRules = z.infer<typeof VocabularyRulesSchema>
export type ContentRules = z.infer<typeof ContentRulesSchema>
export type UpsertCharterInput = z.infer<typeof UpsertCharterSchema>
