import { describe, it, expect } from 'vitest'
import { campaignToInitialWizardState } from './useCampaignWizard'
import type { Campaign } from '@/types/database'

describe('campaignToInitialWizardState', () => {
  const baseCampaign: Campaign = {
    id: 'camp-1',
    workspace_id: 'ws-1',
    template_id: 'tmpl-1',
    name: 'Test Campaign',
    status: 'Draft',
    raw_data: {
      objectives: 'Increase engagement',
      audience: 'Tech enthusiasts',
      kpis: 'Click-through rate',
      other_field: 'Some value',
    },
    ai_clarification_questions: null,
    editorial_skeleton: null,
    skeleton_approved_by_user: false,
    generated_content: null,
    final_edits: null,
    sent_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: 'user-1',
  }

  it('should set step to 2 when no clarification questions or skeleton', () => {
    const result = campaignToInitialWizardState(baseCampaign)
    expect(result.step).toBe(2)
  })

  it('should set step to 3 when clarification questions exist but no skeleton', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      ai_clarification_questions: [
        { question: 'Q1?', answer: 'A1', category: 'tone' },
        { question: 'Q2?', answer: 'A2', category: 'structure' },
      ],
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.step).toBe(3)
  })

  it('should set step to 4 when skeleton exists', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      editorial_skeleton: {
        angle: 'Lead generation',
        key_messages: ['Message 1', 'Message 2'],
        content_type: 'Blog post',
        tone: 'Professional',
      },
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.step).toBe(4)
  })

  it('should extract campaignId and name', () => {
    const result = campaignToInitialWizardState(baseCampaign)
    expect(result.campaignId).toBe('camp-1')
    expect(result.campaignName).toBe('Test Campaign')
  })

  it('should extract objectives, audience, and kpis from rawData', () => {
    const result = campaignToInitialWizardState(baseCampaign)
    expect(result.objectives).toBe('Increase engagement')
    expect(result.audience).toBe('Tech enthusiasts')
    expect(result.kpis).toBe('Click-through rate')
  })

  it('should preserve entire rawData', () => {
    const result = campaignToInitialWizardState(baseCampaign)
    expect(result.rawData).toEqual(baseCampaign.raw_data)
  })

  it('should return empty strings when objectives/audience/kpis missing', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      raw_data: { other_field: 'value' },
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.objectives).toBe('')
    expect(result.audience).toBe('')
    expect(result.kpis).toBe('')
  })

  it('should parse clarificationQA from JSON', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      ai_clarification_questions: [
        { question: 'Q1?', answer: 'A1', category: 'tone' as const },
        { question: 'Q2?', answer: 'A2', category: 'audience' as const },
      ],
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.clarificationQA).toEqual([
      { question: 'Q1?', answer: 'A1', category: 'tone' },
      { question: 'Q2?', answer: 'A2', category: 'audience' },
    ])
  })

  it('should return empty array when clarificationQA parsing fails', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      ai_clarification_questions: 'invalid json string',
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.clarificationQA).toEqual([])
  })

  it('should parse editorial skeleton', () => {
    const skeletonData = {
      angle: 'Educational',
      key_messages: ['Learn new skills'],
      content_type: 'Video',
      tone: 'Friendly',
    }
    const campaign: Campaign = {
      ...baseCampaign,
      editorial_skeleton: skeletonData,
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.skeleton).toEqual(skeletonData)
  })

  it('should return undefined skeleton when parsing fails', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      editorial_skeleton: { invalid: 'structure' },
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.skeleton).toBeUndefined()
  })

  it('should return undefined skeleton when null', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      editorial_skeleton: null,
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.skeleton).toBeUndefined()
  })

  it('should map skeletonApproved', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      skeleton_approved_by_user: true,
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.skeletonApproved).toBe(true)
  })

  it('should return Partial<WizardState> with correct structure', () => {
    const result = campaignToInitialWizardState(baseCampaign)
    expect(result).toHaveProperty('step')
    expect(result).toHaveProperty('campaignId')
    expect(result).toHaveProperty('campaignName')
    expect(result).toHaveProperty('rawData')
    expect(result).toHaveProperty('objectives')
    expect(result).toHaveProperty('audience')
    expect(result).toHaveProperty('kpis')
    expect(result).toHaveProperty('clarificationQA')
    expect(result).toHaveProperty('skeleton')
    expect(result).toHaveProperty('skeletonApproved')
  })

  it('should prioritize skeleton existence over empty clarification questions', () => {
    const campaign: Campaign = {
      ...baseCampaign,
      ai_clarification_questions: [],
      editorial_skeleton: {
        angle: 'Test',
        key_messages: [],
        content_type: 'Post',
      },
    }
    const result = campaignToInitialWizardState(campaign)
    expect(result.step).toBe(4)
  })
})
