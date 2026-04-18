import { z } from 'zod'

export const WorkspaceTypeSchema = z.enum(['Association', 'Personal'])

export const SocialNetworkConfigSchema = z.object({
  enabled: z.boolean().default(false),
  handle: z.string().optional(),
  url: z.string().url().optional(),
})

export const SocialNetworksSchema = z.record(z.string(), SocialNetworkConfigSchema)

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  type: WorkspaceTypeSchema,
  logo_url: z.string().url().optional().nullable(),
  default_llm_model: z.string().default('gpt-4o'),
  system_prompt_global: z.string().optional().nullable(),
  social_networks: SocialNetworksSchema.default({}),
  platform_specific_prompts: z.record(z.string(), z.string()).default({}),
  campaign_targets: z.array(z.string()).default([]),
})

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>
