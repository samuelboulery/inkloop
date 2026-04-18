import { describe, it, expect } from 'vitest'
import { updateCampaignContent } from './wizardActions'
import type { GeneratedPost } from '@/lib/schemas/campaign'

describe('updateCampaignContent', () => {
  it('should throw an error when newStatus is "Sent"', async () => {
    const mockContent: Record<string, GeneratedPost> = {
      post1: {
        caption: 'Test caption',
        hashtags: ['#test'],
        image_url: null,
        platform: 'twitter',
      },
    }

    await expect(
      updateCampaignContent({
        campaignId: 'campaign-123',
        content: mockContent,
        newStatus: 'Sent',
      })
    ).rejects.toThrow('Impossible de modifier une campagne déjà envoyée')
  })

  // Database-dependent tests require `pnpm supabase start` to run locally.
  // Tests below are skipped in CI without local Supabase instance.
  // Example test structure (commented out):
  //
  // it('should update campaign content and status', async () => {
  //   const mockContent: Record<string, GeneratedPost> = {
  //     post1: {
  //       caption: 'Test caption',
  //       hashtags: ['#test'],
  //       image_url: null,
  //       platform: 'twitter',
  //     },
  //   }
  //
  //   const result = await updateCampaignContent({
  //     campaignId: 'campaign-123',
  //     content: mockContent,
  //     newStatus: 'Ready',
  //   })
  //
  //   expect(result).toMatchObject({
  //     id: 'campaign-123',
  //     status: 'Ready',
  //     generated_content: mockContent,
  //   })
  // })
})
