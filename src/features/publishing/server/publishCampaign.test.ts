import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { GeneratedPost } from '@/lib/schemas/campaign'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'
import { publishCampaign } from './publishCampaign'

const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111'
const WORKSPACE_ID = '22222222-2222-4222-8222-222222222222'
const EVENT_ID_IG = '33333333-3333-4333-8333-333333333333'
const EVENT_ID_LI = '44444444-4444-4444-8444-444444444444'

function samplePost(overrides: Partial<GeneratedPost> = {}): GeneratedPost {
  return {
    caption: 'Caption par défaut pour test',
    hashtags: ['#test'],
    image_url: null,
    platform: 'instagram',
    ...overrides,
  }
}

interface CampaignRow {
  id: string
  workspace_id: string
  status: 'Draft' | 'InProgress' | 'Ready' | 'Sent'
  generated_content: Record<string, GeneratedPost> | null
  final_edits: Record<string, Partial<GeneratedPost>> | null
}

interface RateLimitRpcResponse {
  allowed: boolean
  current_count: number
  retry_after_seconds: number
}

interface SupabaseMockOptions {
  campaign: CampaignRow | null
  loadError?: { message: string } | null
  insertError?: { message: string } | null
  campaignUpdateError?: { message: string } | null
  eventIds?: string[]
  rateLimit?: RateLimitRpcResponse
}

function buildSupabaseMock(opts: SupabaseMockOptions) {
  const singleMock = vi.fn().mockResolvedValue({
    data: opts.campaign,
    error: opts.loadError ?? null,
  })
  const selectEqChain = { single: singleMock }
  const selectEqMock = vi.fn().mockReturnValue(selectEqChain)
  const campaignsSelectMock = vi.fn().mockReturnValue({ eq: selectEqMock })

  const events = (opts.eventIds ?? [EVENT_ID_IG, EVENT_ID_LI]).map((id, idx) => ({
    id,
    platform: idx === 0 ? 'instagram' : 'linkedin',
  }))
  const insertSelectMock = vi.fn().mockResolvedValue({
    data: opts.insertError ? null : events,
    error: opts.insertError ?? null,
  })
  const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock })

  const eventsUpdateInMock = vi.fn().mockResolvedValue({ error: null })
  const eventsUpdateMock = vi.fn().mockReturnValue({ in: eventsUpdateInMock })

  const campaignUpdateEqMock = vi.fn().mockResolvedValue({
    error: opts.campaignUpdateError ?? null,
  })
  const campaignUpdateMock = vi.fn().mockReturnValue({ eq: campaignUpdateEqMock })

  const fromMock = vi.fn((table: string) => {
    if (table === 'campaigns') {
      return {
        select: campaignsSelectMock,
        update: campaignUpdateMock,
      }
    }
    if (table === 'publishing_events') {
      return {
        insert: insertMock,
        update: eventsUpdateMock,
      }
    }
    throw new Error(`Table non mockée : ${table}`)
  })

  const rateLimitRow: RateLimitRpcResponse = opts.rateLimit ?? {
    allowed: true,
    current_count: 1,
    retry_after_seconds: 0,
  }
  const rpcMock = vi.fn().mockResolvedValue({ data: [rateLimitRow], error: null })

  return {
    client: { from: fromMock, rpc: rpcMock },
    spies: {
      fromMock,
      rpcMock,
      singleMock,
      insertMock,
      insertSelectMock,
      eventsUpdateMock,
      eventsUpdateInMock,
      campaignUpdateMock,
      campaignUpdateEqMock,
    },
  }
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook/test'
  delete process.env.N8N_WEBHOOK_SECRET
  vi.mocked(createServerClient).mockReset()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
})

describe('publishCampaign', () => {
  it('publie une campagne Ready : insère les événements, appelle n8n, marque Sent', async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: {
        instagram: samplePost({ platform: 'instagram' }),
        linkedin: samplePost({ platform: 'linkedin' }),
      },
      final_edits: {},
    }
    const { client, spies } = buildSupabaseMock({ campaign })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('ok', { status: 200 }))

    const result = await publishCampaign({
      campaignId: CAMPAIGN_ID,
      scheduledFor: null,
    })

    expect(result.status).toBe('sent')
    expect(result.eventIds).toEqual([EVENT_ID_IG, EVENT_ID_LI])

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://n8n.example.com/webhook/test')
    expect(init?.method).toBe('POST')
    const body = JSON.parse(String(init?.body))
    expect(body.event_ids).toEqual([EVENT_ID_IG, EVENT_ID_LI])
    expect(body.campaign_id).toBe(CAMPAIGN_ID)

    expect(spies.insertMock).toHaveBeenCalledOnce()
    const insertedRows = spies.insertMock.mock.calls[0][0]
    expect(insertedRows).toHaveLength(2)
    expect(insertedRows[0]).toMatchObject({
      workspace_id: WORKSPACE_ID,
      campaign_id: CAMPAIGN_ID,
      platform: 'instagram',
    })

    expect(spies.campaignUpdateMock).toHaveBeenCalled()
    const updateArgs = spies.campaignUpdateMock.mock.calls[0][0]
    expect(updateArgs.status).toBe('Sent')
    expect(typeof updateArgs.sent_at).toBe('string')
  })

  it('retourne status=scheduled quand scheduledFor est fourni', async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: { instagram: samplePost() },
      final_edits: {},
    }
    const { client } = buildSupabaseMock({ campaign, eventIds: [EVENT_ID_IG] })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))

    const result = await publishCampaign({
      campaignId: CAMPAIGN_ID,
      scheduledFor: '2026-05-01T10:00:00.000Z',
    })

    expect(result.status).toBe('scheduled')
  })

  it("ajoute l'en-tête x-webhook-secret si N8N_WEBHOOK_SECRET est défini", async () => {
    process.env.N8N_WEBHOOK_SECRET = 'super-secret'
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: { instagram: samplePost() },
      final_edits: {},
    }
    const { client } = buildSupabaseMock({ campaign, eventIds: [EVENT_ID_IG] })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('ok', { status: 200 }))

    await publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers['x-webhook-secret']).toBe('super-secret')
  })

  it("lève une erreur si N8N_WEBHOOK_URL n'est pas configuré", async () => {
    delete process.env.N8N_WEBHOOK_URL
    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /N8N_WEBHOOK_URL/,
    )
  })

  it("lève une erreur si la campagne n'existe pas", async () => {
    const { client } = buildSupabaseMock({ campaign: null })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /Campagne introuvable/,
    )
  })

  it('refuse une campagne en statut Draft', async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Draft',
      generated_content: { instagram: samplePost() },
      final_edits: {},
    }
    const { client } = buildSupabaseMock({ campaign })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /non publiable/,
    )
  })

  it("refuse quand aucun contenu n'est présent", async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: {},
      final_edits: {},
    }
    const { client } = buildSupabaseMock({ campaign })
    vi.mocked(createServerClient).mockResolvedValue(client as never)

    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /Aucun contenu/,
    )
  })

  it('propage une erreur si n8n renvoie un statut non-ok et journalise le statut sur les évènements', async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: { instagram: samplePost() },
      final_edits: {},
    }
    const { client, spies } = buildSupabaseMock({ campaign, eventIds: [EVENT_ID_IG] })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('boom', { status: 502 }))

    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /Publication impossible/,
    )

    expect(spies.eventsUpdateMock).toHaveBeenCalled()
    const updateArgs = spies.eventsUpdateMock.mock.calls[0][0]
    expect(updateArgs.response_status).toBe(502)
  })

  it('lève une erreur de rate limit et n’appelle pas le webhook quand la limite est atteinte', async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: { instagram: samplePost() },
      final_edits: {},
    }
    const { client, spies } = buildSupabaseMock({
      campaign,
      eventIds: [EVENT_ID_IG],
      rateLimit: { allowed: false, current_count: 10, retry_after_seconds: 42 },
    })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    const fetchMock = vi.spyOn(global, 'fetch')

    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /Limite de publication atteinte/,
    )

    expect(spies.rpcMock).toHaveBeenCalledWith('check_and_record_webhook_rate_limit', {
      p_workspace_id: WORKSPACE_ID,
      p_window_seconds: 60,
      p_max_requests: 10,
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(spies.insertMock).not.toHaveBeenCalled()
  })

  it('propage une erreur et enregistre response_status=0 quand fetch lui-même échoue', async () => {
    const campaign: CampaignRow = {
      id: CAMPAIGN_ID,
      workspace_id: WORKSPACE_ID,
      status: 'Ready',
      generated_content: { instagram: samplePost() },
      final_edits: {},
    }
    const { client, spies } = buildSupabaseMock({ campaign, eventIds: [EVENT_ID_IG] })
    vi.mocked(createServerClient).mockResolvedValue(client as never)
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'))

    await expect(publishCampaign({ campaignId: CAMPAIGN_ID, scheduledFor: null })).rejects.toThrow(
      /network down/,
    )

    const updateArgs = spies.eventsUpdateMock.mock.calls[0][0]
    expect(updateArgs.response_status).toBe(0)
    expect(updateArgs.response_body).toMatch(/network down/)
  })
})
