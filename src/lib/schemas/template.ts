import { z } from 'zod'

export const TemplateFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'date', 'url', 'select', 'multiselect']),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // pour select/multiselect
  helpText: z.string().optional(),
})

export const CreateTemplateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  fields: z.array(TemplateFieldSchema).min(1, 'Au moins un champ est requis'),
})

export const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  id: z.string().uuid(),
})

export type TemplateField = z.infer<typeof TemplateFieldSchema>
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>
