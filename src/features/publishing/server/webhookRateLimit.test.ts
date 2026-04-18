import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkAndRecordWebhookRateLimit,
  WebhookRateLimitError,
  resolveRateLimitConfig,
} from './webhookRateLimit'

const WORKSPACE_ID = '22222222-2222-4222-8222-222222222222'

interface RpcResponse {
  allowed: boolean
  current_count: number
  retry_after_seconds: number
}

function buildSupabaseMock(response: RpcResponse | null, error: { message: string } | null = null) {
  const rpcMock = vi.fn().mockResolvedValue({
    data: response ? [response] : null,
    error,
  })
  return {
    client: { rpc: rpcMock },
    rpcMock,
  }
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.WEBHOOK_RATE_LIMIT_WINDOW_SECONDS
  delete process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
})

describe('resolveRateLimitConfig', () => {
  it('retourne les valeurs par défaut quand aucune variable env', () => {
    expect(resolveRateLimitConfig()).toEqual({
      windowSeconds: 60,
      maxRequests: 10,
    })
  })

  it('lit les variables env quand présentes', () => {
    process.env.WEBHOOK_RATE_LIMIT_WINDOW_SECONDS = '120'
    process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS = '5'
    expect(resolveRateLimitConfig()).toEqual({
      windowSeconds: 120,
      maxRequests: 5,
    })
  })

  it('ignore des variables env invalides et retombe sur les défauts', () => {
    process.env.WEBHOOK_RATE_LIMIT_WINDOW_SECONDS = 'pouet'
    process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS = '-3'
    expect(resolveRateLimitConfig()).toEqual({
      windowSeconds: 60,
      maxRequests: 10,
    })
  })
})

describe('checkAndRecordWebhookRateLimit', () => {
  it('ne lève pas quand allowed=true', async () => {
    const { client, rpcMock } = buildSupabaseMock({
      allowed: true,
      current_count: 3,
      retry_after_seconds: 0,
    })

    await expect(
      checkAndRecordWebhookRateLimit(client as never, WORKSPACE_ID),
    ).resolves.toBeUndefined()

    expect(rpcMock).toHaveBeenCalledWith('check_and_record_webhook_rate_limit', {
      p_workspace_id: WORKSPACE_ID,
      p_window_seconds: 60,
      p_max_requests: 10,
    })
  })

  it('transmet la config personnalisée au RPC', async () => {
    const { client, rpcMock } = buildSupabaseMock({
      allowed: true,
      current_count: 1,
      retry_after_seconds: 0,
    })

    await checkAndRecordWebhookRateLimit(client as never, WORKSPACE_ID, {
      windowSeconds: 30,
      maxRequests: 2,
    })

    expect(rpcMock).toHaveBeenCalledWith('check_and_record_webhook_rate_limit', {
      p_workspace_id: WORKSPACE_ID,
      p_window_seconds: 30,
      p_max_requests: 2,
    })
  })

  it('lève WebhookRateLimitError quand allowed=false avec retry_after_seconds', async () => {
    const { client } = buildSupabaseMock({
      allowed: false,
      current_count: 10,
      retry_after_seconds: 42,
    })

    await expect(
      checkAndRecordWebhookRateLimit(client as never, WORKSPACE_ID),
    ).rejects.toBeInstanceOf(WebhookRateLimitError)

    try {
      await checkAndRecordWebhookRateLimit(client as never, WORKSPACE_ID)
    } catch (error) {
      expect(error).toBeInstanceOf(WebhookRateLimitError)
      const rateLimitError = error as WebhookRateLimitError
      expect(rateLimitError.retryAfterSeconds).toBe(42)
      expect(rateLimitError.currentCount).toBe(10)
      expect(rateLimitError.message).toMatch(/Limite de publication atteinte/)
      expect(rateLimitError.message).toMatch(/42/)
    }
  })

  it("lève une erreur générique si l'appel RPC échoue", async () => {
    const { client } = buildSupabaseMock(null, { message: 'db down' })
    await expect(
      checkAndRecordWebhookRateLimit(client as never, WORKSPACE_ID),
    ).rejects.toThrow(/db down/)
  })

  it('lève une erreur si la réponse RPC est vide', async () => {
    const { client } = buildSupabaseMock(null)
    await expect(
      checkAndRecordWebhookRateLimit(client as never, WORKSPACE_ID),
    ).rejects.toThrow(/Réponse invalide/)
  })
})
