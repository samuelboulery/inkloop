import type { AIProvider, AIMessage } from './providers'
import { validateAllPosts, type CharterRules } from './charter-validator'
import type { GeneratedPost } from '@/lib/schemas/campaign'

export interface GenerationAttempt {
  attemptNumber: number
  messages: AIMessage[]
  rawResponse: string
  model: string
  tokensUsed: number | null
  inputTokens: number | null
  outputTokens: number | null
  content: Record<string, GeneratedPost>
  validation: { passed: boolean; violations: Record<string, string[]> }
}

export interface RegenerateInput {
  provider: AIProvider
  initialMessages: AIMessage[]
  rebuildMessages: (ctx: { previousResponse: string; violationSummary: string }) => AIMessage[]
  rules: CharterRules
  parseContent: (raw: string) => Record<string, GeneratedPost>
  maxAttempts?: number
  initialBackoffMs?: number
  sleep?: (ms: number) => Promise<void>
}

export interface RegenerateResult {
  attempts: GenerationAttempt[]
  final: GenerationAttempt
}

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BACKOFF_MS = 500

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function summarizeViolations(violations: Record<string, string[]>): string {
  return Object.entries(violations)
    .map(([platform, platformViolations]) => `${platform}: ${platformViolations.join('; ')}`)
    .join('\n')
}

async function runAttempt(
  provider: AIProvider,
  messages: AIMessage[],
  attemptNumber: number,
  parseContent: (raw: string) => Record<string, GeneratedPost>,
  rules: CharterRules,
): Promise<GenerationAttempt> {
  const response = await provider.generate(messages)
  const content = parseContent(response.content)
  const validation = validateAllPosts(content, rules)
  return {
    attemptNumber,
    messages,
    rawResponse: response.content,
    model: response.model,
    tokensUsed: response.tokensUsed,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    content,
    validation,
  }
}

export async function regenerateUntilValid(input: RegenerateInput): Promise<RegenerateResult> {
  const {
    provider,
    initialMessages,
    rebuildMessages,
    rules,
    parseContent,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    initialBackoffMs = DEFAULT_BACKOFF_MS,
    sleep = defaultSleep,
  } = input

  if (maxAttempts < 1) {
    throw new Error('maxAttempts doit être >= 1')
  }

  async function chain(
    previous: readonly GenerationAttempt[],
    messages: AIMessage[],
  ): Promise<GenerationAttempt[]> {
    const attempt = await runAttempt(provider, messages, previous.length + 1, parseContent, rules)
    const all = [...previous, attempt]

    if (attempt.validation.passed || all.length >= maxAttempts) {
      return all
    }

    const backoffMs = initialBackoffMs * 2 ** (all.length - 1)
    await sleep(backoffMs)

    const nextMessages = rebuildMessages({
      previousResponse: attempt.rawResponse,
      violationSummary: summarizeViolations(attempt.validation.violations),
    })
    return chain(all, nextMessages)
  }

  const attempts = await chain([], initialMessages)
  return { attempts, final: attempts[attempts.length - 1] }
}
