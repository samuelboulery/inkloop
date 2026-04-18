import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface RateLimitConfig {
  windowSeconds: number
  maxRequests: number
}

const DEFAULT_WINDOW_SECONDS = 60
const DEFAULT_MAX_REQUESTS = 10

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export function resolveRateLimitConfig(): RateLimitConfig {
  return {
    windowSeconds:
      parsePositiveInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_SECONDS) ?? DEFAULT_WINDOW_SECONDS,
    maxRequests:
      parsePositiveInt(process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS) ?? DEFAULT_MAX_REQUESTS,
  }
}

export class WebhookRateLimitError extends Error {
  readonly retryAfterSeconds: number
  readonly currentCount: number

  constructor(retryAfterSeconds: number, currentCount: number) {
    super(
      `Limite de publication atteinte pour ce workspace. Réessayez dans ${retryAfterSeconds}s.`,
    )
    this.name = 'WebhookRateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
    this.currentCount = currentCount
  }
}

export async function checkAndRecordWebhookRateLimit(
  client: SupabaseClient<Database>,
  workspaceId: string,
  config?: Partial<RateLimitConfig>,
): Promise<void> {
  const resolved = { ...resolveRateLimitConfig(), ...config }

  const { data, error } = await client.rpc('check_and_record_webhook_rate_limit', {
    p_workspace_id: workspaceId,
    p_window_seconds: resolved.windowSeconds,
    p_max_requests: resolved.maxRequests,
  })

  if (error) {
    throw new Error(`Vérification du rate limit échouée : ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : null
  if (!row) {
    throw new Error('Réponse invalide du rate limiter')
  }

  if (!row.allowed) {
    throw new WebhookRateLimitError(row.retry_after_seconds, row.current_count)
  }
}
