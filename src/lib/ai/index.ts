'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createProvider } from './providers'
import {
  buildClarificationsPrompt,
  buildSkeletonPrompt,
  buildContentPrompt,
  buildValidationPrompt,
} from './prompt-builder'
import { safeParseJson } from './json-parser'
import { regenerateUntilValid } from './regenerate-until-valid'
import { computeCost, type ModelPricing } from './cost-calculator'
import {
  ClarificationQASchema,
  EditorialSkeletonSchema,
  GeneratedPostSchema,
} from '@/lib/schemas/campaign'
import type { ClarificationQA, EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import type { VocabularyRules, ContentRules } from '@/lib/schemas/charter'
import { SocialNetworksSchema } from '@/lib/schemas/workspace'
import { z } from 'zod'

interface WorkspaceAIConfig {
  platforms: string[]
  model: string | undefined
  globalSystemPrompt: string | null
  platformSpecificPrompts: Record<string, string>
  campaignTargets: string[]
}

async function loadWorkspaceAIConfig(workspaceId: string): Promise<WorkspaceAIConfig> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('workspaces')
    .select(
      'social_networks, default_llm_model, system_prompt_global, platform_specific_prompts, campaign_targets',
    )
    .eq('id', workspaceId)
    .single()

  const parsed = SocialNetworksSchema.safeParse(data?.social_networks ?? {})
  const platforms = parsed.success
    ? Object.entries(parsed.data)
        .filter(([, config]) => config.enabled)
        .map(([name]) => name)
    : []

  return {
    platforms,
    model: data?.default_llm_model ?? undefined,
    globalSystemPrompt: data?.system_prompt_global ?? null,
    platformSpecificPrompts: (data?.platform_specific_prompts as Record<string, string>) ?? {},
    campaignTargets: (data?.campaign_targets as string[]) ?? [],
  }
}

interface CharterContext {
  toneGuidelines: string | null
  forbiddenWords: string[]
  forbiddenTopics: string[]
  allowedTopics: string[]
  brandGuidelines: string | null
  preferredWords: Record<string, string[]>
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
  templateSystemPrompt?: string | null
}

export interface GenerateSkeletonInput {
  workspaceId: string
  campaignName: string
  rawData: Record<string, unknown>
  clarifications: ClarificationQA[]
  templateSystemPrompt?: string | null
}

export interface GenerateContentInput {
  workspaceId: string
  campaignName: string
  skeleton: EditorialSkeleton
  platforms?: string[]
  templateSystemPrompt?: string | null
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
      preferredWords: vocabRules.preferred ?? {},
    },
    rules: {
      vocabularyRules: vocabRules,
      contentRules,
      toneGuidelines: data?.tone_guidelines ?? null,
    },
  }
}

async function loadModelPricing(modelId: string): Promise<ModelPricing | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('ai_pricing')
    .select('input_cost_per_1m, output_cost_per_1m')
    .eq('model_id', modelId)
    .maybeSingle()

  if (!data) return null

  return {
    inputCostPer1M: Number(data.input_cost_per_1m),
    outputCostPer1M: Number(data.output_cost_per_1m),
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
  inputTokens: number | null
  outputTokens: number | null
  charterValidationPassed: boolean | null
}): Promise<void> {
  const supabase = await createServerClient()
  const pricing = await loadModelPricing(params.model)
  const { inputCostUsd, outputCostUsd } = computeCost({
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    pricing,
  })

  await supabase.from('ai_logs').insert({
    workspace_id: params.workspaceId,
    campaign_id: params.campaignId ?? null,
    model_used: params.model,
    step: params.step,
    prompt: params.prompt,
    response: params.response,
    tokens_used: params.tokensUsed,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    input_cost_usd: inputCostUsd,
    output_cost_usd: outputCostUsd,
    charter_validation_passed: params.charterValidationPassed,
  })
}

export async function generateClarificationQuestions(
  input: GenerateClarificationsInput,
): Promise<ClarificationQA[]> {
  const { model, globalSystemPrompt, platformSpecificPrompts, campaignTargets } =
    await loadWorkspaceAIConfig(input.workspaceId)
  const provider = createProvider(model)
  const { charter } = await loadCharter(input.workspaceId)

  const messages = buildClarificationsPrompt({
    campaignName: input.campaignName,
    templateName: input.templateName,
    rawData: input.rawData,
    charter,
    templateSystemPrompt: input.templateSystemPrompt,
    globalSystemPrompt,
    platformSpecificPrompts,
    campaignTargets,
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
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
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
  const { platforms, model, globalSystemPrompt, platformSpecificPrompts, campaignTargets } =
    await loadWorkspaceAIConfig(input.workspaceId)
  const provider = createProvider(model)
  const { charter } = await loadCharter(input.workspaceId)

  const messages = buildSkeletonPrompt({
    campaignName: input.campaignName,
    rawData: input.rawData,
    clarifications: input.clarifications,
    charter,
    platforms,
    templateSystemPrompt: input.templateSystemPrompt,
    globalSystemPrompt,
    platformSpecificPrompts,
    campaignTargets,
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
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    charterValidationPassed: null,
  })

  return EditorialSkeletonSchema.parse(parsed)
}

export async function generateContent(
  input: GenerateContentInput,
): Promise<Record<string, GeneratedPost>> {
  const {
    platforms: workspacePlatforms,
    model,
    globalSystemPrompt,
    platformSpecificPrompts,
    campaignTargets,
  } = await loadWorkspaceAIConfig(input.workspaceId)
  const platforms =
    input.platforms && input.platforms.length > 0 ? input.platforms : workspacePlatforms

  if (platforms.length === 0) {
    throw new Error(
      'Aucune plateforme configurée pour ce workspace. Activez au moins un réseau social dans les paramètres.',
    )
  }

  const provider = createProvider(model)
  const { charter, rules } = await loadCharter(input.workspaceId)

  const messages = buildContentPrompt({
    campaignName: input.campaignName,
    skeleton: input.skeleton,
    platforms,
    charter,
    templateSystemPrompt: input.templateSystemPrompt,
    globalSystemPrompt,
    platformSpecificPrompts,
    campaignTargets,
  })

  const PostMapSchema = z.record(z.string(), GeneratedPostSchema)
  const parseContent = (raw: string): Record<string, GeneratedPost> => {
    const parsed = safeParseJson(raw)
    // Le modèle omet parfois le champ `platform` — on le dérive de la clé.
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
        if (val && typeof val === 'object' && !('platform' in val)) {
          ;(val as Record<string, unknown>)['platform'] = key
        }
      }
    }
    return PostMapSchema.parse(parsed)
  }

  const result = await regenerateUntilValid({
    provider,
    initialMessages: messages,
    rebuildMessages: ({ previousResponse, violationSummary }) =>
      buildValidationPrompt(previousResponse, charter, violationSummary),
    rules,
    parseContent,
  })

  await Promise.all(
    result.attempts.map((attempt) =>
      logAICall({
        workspaceId: input.workspaceId,
        model: attempt.model,
        step: attempt.attemptNumber === 1 ? 'generation' : 'validation',
        prompt: attempt.messages[attempt.messages.length - 1].content,
        response: attempt.rawResponse,
        tokensUsed: attempt.tokensUsed,
        inputTokens: attempt.inputTokens,
        outputTokens: attempt.outputTokens,
        charterValidationPassed: attempt.validation.passed,
      }),
    ),
  )

  if (!result.final.validation.passed) {
    const remaining = Object.entries(result.final.validation.violations)
      .map(([p, v]) => `${p}: ${v.join('; ')}`)
      .join('\n')
    throw new Error(`Contenu non conforme à la charte après régénération :\n${remaining}`)
  }

  return result.final.content
}
