import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { getCampaign } from './getCampaign'
import { createServerClient } from '@/lib/supabase/server'

describe('getCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null if campaign is not found', async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    vi.mocked(createServerClient).mockResolvedValue(supabase as never)

    const result = await getCampaign('unknown-id')
    expect(result).toBeNull()
  })

  it('returns the campaign if it exists', async () => {
    const mockCampaign = { id: 'abc', name: 'Test', status: 'Draft' }
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCampaign, error: null }),
    }
    vi.mocked(createServerClient).mockResolvedValue(supabase as never)

    const result = await getCampaign('abc')
    expect(result).toEqual(mockCampaign)
  })
})
