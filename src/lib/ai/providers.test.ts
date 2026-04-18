import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  resolveProviderFor,
  createProvider,
  AnthropicProvider,
  OpenAIProvider,
  OllamaProvider,
} from './providers'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.OPENAI_API_KEY
  delete process.env.OLLAMA_BASE_URL
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
})

describe('resolveProviderFor', () => {
  it('route les modèles claude-* vers AnthropicProvider', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    const provider = resolveProviderFor('claude-haiku-4-5-20251001')
    expect(provider).toBeInstanceOf(AnthropicProvider)
    expect(provider.modelId).toBe('claude-haiku-4-5-20251001')
  })

  it('route les modèles gpt-* vers OpenAIProvider', () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const provider = resolveProviderFor('gpt-4o-mini')
    expect(provider).toBeInstanceOf(OpenAIProvider)
  })

  it('route o1/o3/o4 vers OpenAIProvider', () => {
    process.env.OPENAI_API_KEY = 'test-key'
    expect(resolveProviderFor('o1-mini')).toBeInstanceOf(OpenAIProvider)
    expect(resolveProviderFor('o3')).toBeInstanceOf(OpenAIProvider)
    expect(resolveProviderFor('o4-preview')).toBeInstanceOf(OpenAIProvider)
  })

  it('est insensible à la casse', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    expect(resolveProviderFor('CLAUDE-OPUS')).toBeInstanceOf(AnthropicProvider)
  })

  it('route les modèles inconnus vers Ollama si OLLAMA_BASE_URL est défini', () => {
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
    const provider = resolveProviderFor('llama3.2')
    expect(provider).toBeInstanceOf(OllamaProvider)
  })

  it('lève une erreur si claude demandé sans ANTHROPIC_API_KEY', () => {
    expect(() => resolveProviderFor('claude-haiku-4-5')).toThrow(/ANTHROPIC_API_KEY/)
  })

  it('lève une erreur si gpt demandé sans OPENAI_API_KEY', () => {
    expect(() => resolveProviderFor('gpt-4o')).toThrow(/OPENAI_API_KEY/)
  })

  it('lève une erreur si modèle inconnu et Ollama non configuré', () => {
    expect(() => resolveProviderFor('mystery-model')).toThrow(/OLLAMA_BASE_URL/)
  })
})

describe('createProvider', () => {
  it('résout le modèle fourni quand un modelId est passé', () => {
    process.env.ANTHROPIC_API_KEY = 'key'
    const provider = createProvider('claude-haiku-4-5')
    expect(provider).toBeInstanceOf(AnthropicProvider)
  })

  it('privilégie Anthropic par défaut quand la clé est présente', () => {
    process.env.ANTHROPIC_API_KEY = 'key'
    process.env.OPENAI_API_KEY = 'key'
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
    expect(createProvider()).toBeInstanceOf(AnthropicProvider)
  })

  it('retombe sur OpenAI si Anthropic absent', () => {
    process.env.OPENAI_API_KEY = 'key'
    expect(createProvider()).toBeInstanceOf(OpenAIProvider)
  })

  it('retombe sur Ollama si Anthropic et OpenAI absents', () => {
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
    expect(createProvider()).toBeInstanceOf(OllamaProvider)
  })

  it("lève une erreur si aucun provider n'est configuré", () => {
    expect(() => createProvider()).toThrow(/Aucun fournisseur IA/)
  })

  it('ignore un modelId vide et bascule en auto-détection', () => {
    process.env.ANTHROPIC_API_KEY = 'key'
    expect(createProvider('')).toBeInstanceOf(AnthropicProvider)
  })
})

describe('AnthropicProvider.generate', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('appelle l’API Anthropic avec les bons headers et body', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{"ok": true}' }],
          model: 'claude-haiku-4-5-20251001',
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const provider = new AnthropicProvider('claude-haiku-4-5-20251001')
    const result = await provider.generate([
      { role: 'system', content: 'tu es utile' },
      { role: 'user', content: 'salut' },
    ])

    expect(result).toEqual({
      content: '{"ok": true}',
      model: 'claude-haiku-4-5-20251001',
      tokensUsed: 30,
      inputTokens: 10,
      outputTokens: 20,
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('test-key')
    expect(headers['anthropic-version']).toBe('2023-06-01')

    const body = JSON.parse(String(init?.body))
    expect(body.system).toBe('tu es utile')
    expect(body.messages).toEqual([{ role: 'user', content: 'salut' }])
  })

  it('propage une erreur explicite si Anthropic renvoie un statut non-ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('rate limit', { status: 429 }))
    const provider = new AnthropicProvider()
    await expect(provider.generate([{ role: 'user', content: 'salut' }])).rejects.toThrow(
      /Anthropic API error 429/,
    )
  })

  it('lève une erreur si ANTHROPIC_API_KEY est absente à l’instanciation', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(() => new AnthropicProvider()).toThrow(/ANTHROPIC_API_KEY/)
  })

  it('utilise la valeur par défaut max_tokens=4096 quand ANTHROPIC_MAX_TOKENS absent', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{}' }],
          model: 'claude-haiku-4-5',
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200 },
      ),
    )

    await new AnthropicProvider().generate([{ role: 'user', content: 'hi' }])
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.max_tokens).toBe(4096)
  })

  it('respecte ANTHROPIC_MAX_TOKENS quand défini', async () => {
    process.env.ANTHROPIC_MAX_TOKENS = '8192'
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{}' }],
          model: 'claude-haiku-4-5',
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200 },
      ),
    )

    await new AnthropicProvider().generate([{ role: 'user', content: 'hi' }])
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.max_tokens).toBe(8192)
  })

  it('utilise anthropic-version par défaut 2023-06-01 quand ANTHROPIC_VERSION absent', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{}' }],
          model: 'claude-haiku-4-5',
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200 },
      ),
    )

    await new AnthropicProvider().generate([{ role: 'user', content: 'hi' }])
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers['anthropic-version']).toBe('2023-06-01')
  })

  it('respecte ANTHROPIC_VERSION quand défini', async () => {
    process.env.ANTHROPIC_VERSION = '2024-10-01'
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{}' }],
          model: 'claude-haiku-4-5',
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200 },
      ),
    )

    await new AnthropicProvider().generate([{ role: 'user', content: 'hi' }])
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers['anthropic-version']).toBe('2024-10-01')
  })

  it('ignore une valeur ANTHROPIC_MAX_TOKENS non-numérique et retombe sur 4096', async () => {
    process.env.ANTHROPIC_MAX_TOKENS = 'not-a-number'
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: '{}' }],
          model: 'claude-haiku-4-5',
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200 },
      ),
    )

    await new AnthropicProvider().generate([{ role: 'user', content: 'hi' }])
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.max_tokens).toBe(4096)
  })
})
