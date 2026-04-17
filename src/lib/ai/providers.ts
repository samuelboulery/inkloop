import OpenAI from 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  tokensUsed: number | null
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
    return {
      content: choice.message.content ?? '',
      model: this.modelId,
      tokensUsed: response.usage?.total_tokens ?? null,
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
    return {
      content: choice.message.content ?? '',
      model: this.modelId,
      tokensUsed: response.usage?.total_tokens ?? null,
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

    const body = {
      model: this.modelId,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: userMessages,
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
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
    return {
      content: text,
      model: this.modelId,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    }
  }
}

export function createProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) return new AnthropicProvider()
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider()
  const ollamaUrl = process.env.OLLAMA_BASE_URL
  if (ollamaUrl) return new OllamaProvider()
  throw new Error('Aucun fournisseur IA configuré. Ajoutez ANTHROPIC_API_KEY, OPENAI_API_KEY ou OLLAMA_BASE_URL.')
}
