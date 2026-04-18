import { describe, it, expect, beforeEach, vi } from 'vitest'
import { regenerateUntilValid } from './regenerate-until-valid'
import type { AIProvider, AIMessage } from './providers'
import type { CharterRules } from './charter-validator'
import type { GeneratedPost } from '@/lib/schemas/campaign'

function makePost(caption: string): GeneratedPost {
  return { caption, hashtags: [], platform: 'instagram' }
}

const emptyRules: CharterRules = {
  vocabularyRules: { forbidden: [], preferred: {} },
  contentRules: { allowed_topics: [], forbidden_topics: [] },
  toneGuidelines: null,
}

const forbidCrapRules: CharterRules = {
  vocabularyRules: { forbidden: ['crap'], preferred: {} },
  contentRules: { allowed_topics: [], forbidden_topics: [] },
  toneGuidelines: null,
}

function makeProvider(responses: string[]): AIProvider {
  const queue = [...responses]
  return {
    modelId: 'test-model',
    generate: vi.fn(async (_messages: AIMessage[]) => {
      const content = queue.shift()
      if (content === undefined) throw new Error('Provider queue vide')
      return { content, model: 'test-model', tokensUsed: 42, inputTokens: 30, outputTokens: 12 }
    }),
  }
}

function parseContent(raw: string): Record<string, GeneratedPost> {
  return JSON.parse(raw) as Record<string, GeneratedPost>
}

const initialMessages: AIMessage[] = [{ role: 'user', content: 'go' }]

type RebuildMessagesFn = (ctx: {
  previousResponse: string
  violationSummary: string
}) => AIMessage[]

describe('regenerateUntilValid', () => {
  let rebuildMessages: RebuildMessagesFn & ReturnType<typeof vi.fn>

  beforeEach(() => {
    rebuildMessages = vi.fn<RebuildMessagesFn>(
      (ctx: { previousResponse: string; violationSummary: string }): AIMessage[] => [
        {
          role: 'user',
          content: `régénère corrigé. previous=${ctx.previousResponse} violations=${ctx.violationSummary}`,
        },
      ],
    ) as RebuildMessagesFn & ReturnType<typeof vi.fn>
  })

  it('réussit en un seul appel si la première réponse est valide', async () => {
    const provider = makeProvider([JSON.stringify({ instagram: makePost('hello world') })])
    const sleep = vi.fn(async () => {})

    const result = await regenerateUntilValid({
      provider,
      initialMessages,
      rebuildMessages,
      rules: emptyRules,
      parseContent,
      sleep,
    })

    expect(result.attempts).toHaveLength(1)
    expect(result.final.validation.passed).toBe(true)
    expect(result.final.attemptNumber).toBe(1)
    expect(result.final.content).toEqual({ instagram: makePost('hello world') })
    expect(provider.generate).toHaveBeenCalledOnce()
    expect(sleep).not.toHaveBeenCalled()
    expect(rebuildMessages).not.toHaveBeenCalled()
  })

  it('régénère une fois si la 1ère tentative échoue puis 2ème passe', async () => {
    const firstResponse = JSON.stringify({ instagram: makePost('this is crap') })
    const secondResponse = JSON.stringify({ instagram: makePost('this is fine') })
    const provider = makeProvider([firstResponse, secondResponse])
    const sleep = vi.fn(async () => {})

    const result = await regenerateUntilValid({
      provider,
      initialMessages,
      rebuildMessages,
      rules: forbidCrapRules,
      parseContent,
      sleep,
      initialBackoffMs: 500,
    })

    expect(result.attempts).toHaveLength(2)
    expect(result.attempts[0].validation.passed).toBe(false)
    expect(result.attempts[1].validation.passed).toBe(true)
    expect(result.final.validation.passed).toBe(true)
    expect(provider.generate).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledOnce()
    expect(sleep).toHaveBeenCalledWith(500)
    expect(rebuildMessages).toHaveBeenCalledOnce()
    const ctx = rebuildMessages.mock.calls[0][0]
    expect(ctx.previousResponse).toBe(firstResponse)
    expect(ctx.violationSummary).toContain('crap')
    expect(ctx.violationSummary).toContain('instagram')
  })

  it('épuise maxAttempts=3 et renvoie le dernier échec', async () => {
    const provider = makeProvider([
      JSON.stringify({ instagram: makePost('crap one') }),
      JSON.stringify({ instagram: makePost('crap two') }),
      JSON.stringify({ instagram: makePost('crap three') }),
    ])
    const sleep = vi.fn(async () => {})

    const result = await regenerateUntilValid({
      provider,
      initialMessages,
      rebuildMessages,
      rules: forbidCrapRules,
      parseContent,
      sleep,
      maxAttempts: 3,
      initialBackoffMs: 500,
    })

    expect(result.attempts).toHaveLength(3)
    expect(result.final.validation.passed).toBe(false)
    expect(result.final.attemptNumber).toBe(3)
    expect(provider.generate).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenNthCalledWith(1, 500)
    expect(sleep).toHaveBeenNthCalledWith(2, 1000)
  })

  it('utilise initialMessages pour la 1ère tentative puis rebuildMessages pour les suivantes', async () => {
    const provider = makeProvider([
      JSON.stringify({ instagram: makePost('crap one') }),
      JSON.stringify({ instagram: makePost('fixed') }),
    ])

    await regenerateUntilValid({
      provider,
      initialMessages,
      rebuildMessages,
      rules: forbidCrapRules,
      parseContent,
      sleep: async () => {},
    })

    const generateMock = provider.generate as ReturnType<typeof vi.fn>
    expect(generateMock.mock.calls[0][0]).toEqual(initialMessages)
    expect(generateMock.mock.calls[1][0][0].content).toContain('régénère corrigé')
  })

  it('ne régénère pas quand maxAttempts=1 même si échec', async () => {
    const provider = makeProvider([JSON.stringify({ instagram: makePost('crap one') })])
    const sleep = vi.fn(async () => {})

    const result = await regenerateUntilValid({
      provider,
      initialMessages,
      rebuildMessages,
      rules: forbidCrapRules,
      parseContent,
      sleep,
      maxAttempts: 1,
    })

    expect(result.attempts).toHaveLength(1)
    expect(result.final.validation.passed).toBe(false)
    expect(provider.generate).toHaveBeenCalledOnce()
    expect(sleep).not.toHaveBeenCalled()
    expect(rebuildMessages).not.toHaveBeenCalled()
  })

  it('remonte l’erreur si le provider jette', async () => {
    const provider: AIProvider = {
      modelId: 'test',
      generate: vi.fn(async () => {
        throw new Error('rate limit')
      }),
    }

    await expect(
      regenerateUntilValid({
        provider,
        initialMessages,
        rebuildMessages,
        rules: emptyRules,
        parseContent,
        sleep: async () => {},
      }),
    ).rejects.toThrow(/rate limit/)
  })

  it('expose le modèle et les tokens pour chaque tentative', async () => {
    const provider: AIProvider = {
      modelId: 'test-model',
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ instagram: makePost('crap one') }),
          model: 'claude-haiku',
          tokensUsed: 100,
          inputTokens: 40,
          outputTokens: 60,
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ instagram: makePost('clean') }),
          model: 'claude-haiku',
          tokensUsed: 200,
          inputTokens: 80,
          outputTokens: 120,
        }),
    }

    const result = await regenerateUntilValid({
      provider,
      initialMessages,
      rebuildMessages,
      rules: forbidCrapRules,
      parseContent,
      sleep: async () => {},
    })

    expect(result.attempts[0].model).toBe('claude-haiku')
    expect(result.attempts[0].tokensUsed).toBe(100)
    expect(result.attempts[0].inputTokens).toBe(40)
    expect(result.attempts[0].outputTokens).toBe(60)
    expect(result.attempts[1].tokensUsed).toBe(200)
    expect(result.attempts[1].inputTokens).toBe(80)
    expect(result.attempts[1].outputTokens).toBe(120)
  })
})
