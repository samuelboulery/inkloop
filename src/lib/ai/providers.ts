import OpenAI from 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  tokensUsed: number | null
  inputTokens: number | null
  outputTokens: number | null
}

export interface AIProvider {
  generate(messages: AIMessage[]): Promise<AIResponse>
  modelId: string
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  modelId: string

  constructor(modelId = 'gpt-4o-mini') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY non configuré')
    this.client = new OpenAI({ apiKey })
    this.modelId = modelId
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages,
      response_format: { type: 'json_object' },
    })

    const choice = response.choices[0]
    const inputTokens = response.usage?.prompt_tokens ?? null
    const outputTokens = response.usage?.completion_tokens ?? null
    return {
      content: choice.message.content ?? '',
      model: this.modelId,
      tokensUsed: response.usage?.total_tokens ?? null,
      inputTokens,
      outputTokens,
    }
  }
}

export class OllamaProvider implements AIProvider {
  private client: OpenAI
  modelId: string

  constructor(modelId = 'llama3.2') {
    const baseURL = `${process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'}/v1`
    this.client = new OpenAI({ apiKey: 'ollama', baseURL })
    this.modelId = modelId
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages,
    })

    const choice = response.choices[0]
    const inputTokens = response.usage?.prompt_tokens ?? null
    const outputTokens = response.usage?.completion_tokens ?? null
    return {
      content: choice.message.content ?? '',
      model: this.modelId,
      tokensUsed: response.usage?.total_tokens ?? null,
      inputTokens,
      outputTokens,
    }
  }
}

export class AnthropicProvider implements AIProvider {
  private apiKey: string
  modelId: string

  constructor(modelId = 'claude-haiku-4-5-20251001') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configuré')
    this.apiKey = apiKey
    this.modelId = modelId
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    const system = messages.find((m) => m.role === 'system')?.content
    const userMessages = messages.filter((m) => m.role !== 'system')

    const maxTokensRaw = process.env.ANTHROPIC_MAX_TOKENS
    const parsedMaxTokens = maxTokensRaw ? Number.parseInt(maxTokensRaw, 10) : NaN
    const maxTokens =
      Number.isFinite(parsedMaxTokens) && parsedMaxTokens > 0 ? parsedMaxTokens : 4096
    const anthropicVersion = process.env.ANTHROPIC_VERSION ?? '2023-06-01'

    const body = {
      model: this.modelId,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: userMessages,
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': anthropicVersion,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error ${res.status}: ${err}`)
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text: string }>
      model: string
      usage: { input_tokens: number; output_tokens: number }
    }

    const text = data.content.find((b) => b.type === 'text')?.text ?? ''
    const inputTokens = data.usage?.input_tokens ?? null
    const outputTokens = data.usage?.output_tokens ?? null
    const hasUsage = inputTokens !== null || outputTokens !== null
    return {
      content: text,
      model: this.modelId,
      tokensUsed: hasUsage ? (inputTokens ?? 0) + (outputTokens ?? 0) : null,
      inputTokens,
      outputTokens,
    }
  }
}

export function resolveProviderFor(modelId: string): AIProvider {
  const normalized = modelId.trim().toLowerCase()

  if (normalized.startsWith('claude')) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(`Modèle ${modelId} demandé mais ANTHROPIC_API_KEY non configuré`)
    }
    return new AnthropicProvider(modelId)
  }

  if (
    normalized.startsWith('gpt') ||
    normalized.startsWith('o1') ||
    normalized.startsWith('o3') ||
    normalized.startsWith('o4')
  ) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(`Modèle ${modelId} demandé mais OPENAI_API_KEY non configuré`)
    }
    return new OpenAIProvider(modelId)
  }

  if (!process.env.OLLAMA_BASE_URL) {
    throw new Error(`Modèle ${modelId} non reconnu et OLLAMA_BASE_URL non configuré`)
  }
  return new OllamaProvider(modelId)
}

export function createProvider(modelId?: string): AIProvider {
  if (modelId && modelId.length > 0) return resolveProviderFor(modelId)

  if (process.env.ANTHROPIC_API_KEY) return new AnthropicProvider()
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider()
  if (process.env.OLLAMA_BASE_URL) return new OllamaProvider()
  throw new Error(
    'Aucun fournisseur IA configuré. Ajoutez ANTHROPIC_API_KEY, OPENAI_API_KEY ou OLLAMA_BASE_URL.',
  )
}
