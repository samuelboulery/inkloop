'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createProvider } from './providers'
import {
  buildClarificationsPrompt,
  buildSkeletonPrompt,
  buildContentPrompt,
  buildValidationPrompt,
} from './prompt-builder'
import { validateAllPosts } from './charter-validator'
import {
  ClarificationQASchema,
  EditorialSkeletonSchema,
  GeneratedPostSchema,
} from '@/lib/schemas/campaign'
import type { ClarificationQA, EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import type { VocabularyRules, ContentRules } from '@/lib/schemas/charter'
import { z } from 'zod'

interface CharterContext {
  toneGuidelines: string | null
  forbiddenWords: string[]
  forbiddenTopics: string[]
  allowedTopics: string[]
  brandGuidelines: string | null
}

interface CharterRulesForValidation {
  vocabularyRules: VocabularyRules
  contentRules: ContentRules
  toneGuidelines: string | null
}

export interface GenerateClarificationsInput {
  workspaceId: string
  campaignName: string
  rawData: Record<string, unknown>
  templateName: string
}

export interface GenerateSkeletonInput {
  workspaceId: string
  campaignName: string
  rawData: Record<string, unknown>
  clarifications: ClarificationQA[]
}

export interface GenerateContentInput {
  workspaceId: string
  campaignName: string
  skeleton: EditorialSkeleton
  platforms: string[]
}

async function loadCharter(workspaceId: string): Promise<{
  charter: CharterContext
  rules: CharterRulesForValidation
}> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('editorial_charters')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  const vocabRules = (data?.vocabulary_rules as VocabularyRules | null) ?? {
    forbidden: [],
    preferred: {},
  }
  const contentRules = (data?.content_rules as ContentRules | null) ?? {
    allowed_topics: [],
    forbidden_topics: [],
  }

  return {
    charter: {
      toneGuidelines: data?.tone_guidelines ?? null,
      brandGuidelines: data?.brand_guidelines ?? null,
      forbiddenWords: vocabRules.forbidden ?? [],
      forbiddenTopics: contentRules.forbidden_topics ?? [],
      allowedTopics: contentRules.allowed_topics ?? [],
    },
    rules: {
      vocabularyRules: vocabRules,
      contentRules,
      toneGuidelines: data?.tone_guidelines ?? null,
    },
  }
}

async function logAICall(params: {
  workspaceId: string
  campaignId?: string
  model: string
  step: 'clarification' | 'skeleton' | 'generation' | 'validation'
  prompt: string
  response: string
  tokensUsed: number | null
  charterValidationPassed: boolean | null
}): Promise<void> {
  const supabase = await createServerClient()
  await supabase.from('ai_logs').insert({
    workspace_id: params.workspaceId,
    campaign_id: params.campaignId ?? null,
    model_used: params.model,
    step: params.step,
    prompt: params.prompt,
    response: params.response,
    tokens_used: params.tokensUsed,
    charter_validation_passed: params.charterValidationPassed,
  })
}

function safeParseJson(raw: string): unknown {
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Aucun JSON trouvé dans la réponse IA')
  return JSON.parse(jsonMatch[0])
}

export async function generateClarificationQuestions(
  input: GenerateClarificationsInput,
): Promise<ClarificationQA[]> {
  const provider = createProvider()
  const { charter } = await loadCharter(input.workspaceId)

  const messages = buildClarificationsPrompt({
    campaignName: input.campaignName,
    templateName: input.templateName,
    rawData: input.rawData,
    charter,
  })

  const response = await provider.generate(messages)
  const parsed = safeParseJson(response.content) as { questions?: unknown[] }

  await logAICall({
    workspaceId: input.workspaceId,
    model: response.model,
    step: 'clarification',
    prompt: messages[messages.length - 1].content,
    response: response.content,
    tokensUsed: response.tokensUsed,
    charterValidationPassed: null,
  })

  const rawQuestions = Array.isArray(parsed) ? parsed : (parsed?.questions ?? [])
  return z
    .array(ClarificationQASchema.omit({ answer: true }).extend({ answer: z.string().default('') }))
    .parse(rawQuestions)
}

export async function generateEditorialSkeleton(
  input: GenerateSkeletonInput,
): Promise<EditorialSkeleton> {
  const provider = createProvider()
  const supabase = await createServerClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('social_networks')
    .eq('id', input.workspaceId)
    .single()

  const platforms: string[] = Array.isArray(workspace?.social_networks)
    ? (workspace.social_networks as string[])
    : []

  const { charter } = await loadCharter(input.workspaceId)

  const messages = buildSkeletonPrompt({
    campaignName: input.campaignName,
    rawData: input.rawData,
    clarifications: input.clarifications,
    charter,
    platforms,
  })

  const response = await provider.generate(messages)
  const parsed = safeParseJson(response.content)

  await logAICall({
    workspaceId: input.workspaceId,
    model: response.model,
    step: 'skeleton',
    prompt: messages[messages.length - 1].content,
    response: response.content,
    tokensUsed: response.tokensUsed,
    charterValidationPassed: null,
  })

  return EditorialSkeletonSchema.parse(parsed)
}

export async function generateContent(
  input: GenerateContentInput,
): Promise<Record<string, GeneratedPost>> {
  const provider = createProvider()
  const { charter, rules } = await loadCharter(input.workspaceId)

  const messages = buildContentPrompt({
    campaignName: input.campaignName,
    skeleton: input.skeleton,
    platforms: input.platforms,
    charter,
  })

  let response = await provider.generate(messages)
  let parsed = safeParseJson(response.content) as Record<string, unknown>

  const PostMapSchema = z.record(z.string(), GeneratedPostSchema)
  let content = PostMapSchema.parse(parsed)

  const validation = validateAllPosts(content, rules)

  await logAICall({
    workspaceId: input.workspaceId,
    model: response.model,
    step: 'generation',
    prompt: messages[messages.length - 1].content,
    response: response.content,
    tokensUsed: response.tokensUsed,
    charterValidationPassed: validation.passed,
  })

  if (!validation.passed) {
    const violationSummary = Object.entries(validation.violations)
      .map(([p, v]) => `${p}: ${v.join('; ')}`)
      .join('\n')

    const regenMessages = buildValidationPrompt(
      response.content,
      charter,
      violationSummary,
    )

    response = await provider.generate(regenMessages)
    parsed = safeParseJson(response.content) as Record<string, unknown>
    content = PostMapSchema.parse(parsed)

    const revalidation = validateAllPosts(content, rules)

    await logAICall({
      workspaceId: input.workspaceId,
      model: response.model,
      step: 'validation',
      prompt: regenMessages[regenMessages.length - 1].content,
      response: response.content,
      tokensUsed: response.tokensUsed,
      charterValidationPassed: revalidation.passed,
    })

    if (!revalidation.passed) {
      const remaining = Object.entries(revalidation.violations)
        .map(([p, v]) => `${p}: ${v.join('; ')}`)
        .join('\n')
      throw new Error(`Contenu non conforme à la charte après régénération :\n${remaining}`)
    }
  }

  return content
}
