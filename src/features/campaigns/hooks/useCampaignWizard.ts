import { useState, useCallback } from 'react'
import { z } from 'zod'
import type { Campaign, Template } from '@/types/database'
import type { ClarificationQA, EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import { ClarificationQASchema, EditorialSkeletonSchema } from '@/lib/schemas/campaign'
import {
  initializeCampaign,
  saveCampaignObjectives,
  saveClarificationAnswers,
  approveSkeleton,
  saveGeneratedContent,
} from '../server/wizardActions'
import {
  generateClarificationQuestions,
  generateEditorialSkeleton,
  generateContent,
} from '@/lib/ai/index'

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

export interface WizardState {
  step: WizardStep
  campaignId: string | undefined
  selectedTemplate: Template | undefined
  campaignName: string
  rawData: Record<string, unknown>
  objectives: string
  audience: string
  kpis: string
  clarificationQA: ClarificationQA[]
  skeleton: EditorialSkeleton | undefined
  skeletonApproved: boolean
  generatedContent: Record<string, GeneratedPost>
  finalEdits: Record<string, Partial<GeneratedPost>>
  isLoading: boolean
  error: string | undefined
  isComplete: boolean
}

const INITIAL_STATE: WizardState = {
  step: 1,
  campaignId: undefined,
  selectedTemplate: undefined,
  campaignName: '',
  rawData: {},
  objectives: '',
  audience: '',
  kpis: '',
  clarificationQA: [],
  skeleton: undefined,
  skeletonApproved: false,
  generatedContent: {},
  finalEdits: {},
  isLoading: false,
  error: undefined,
  isComplete: false,
}

export function campaignToInitialWizardState(campaign: Campaign): Partial<WizardState> {
  const rawDataRecord = (campaign.raw_data as Record<string, unknown>) || {}

  const clarificationQAParsed = z
    .array(ClarificationQASchema)
    .safeParse(campaign.ai_clarification_questions)
  const clarificationQA = clarificationQAParsed.success ? clarificationQAParsed.data : []

  let skeleton: EditorialSkeleton | undefined
  if (campaign.editorial_skeleton !== null) {
    const skeletonParsed = EditorialSkeletonSchema.safeParse(campaign.editorial_skeleton)
    skeleton = skeletonParsed.success ? skeletonParsed.data : undefined
  }

  let step: WizardStep = 2
  if (skeleton) {
    step = 4
  } else if (clarificationQA.length > 0) {
    step = 3
  }

  return {
    step,
    campaignId: campaign.id,
    campaignName: campaign.name,
    rawData: rawDataRecord,
    objectives: (rawDataRecord.objectives as string) ?? '',
    audience: (rawDataRecord.audience as string) ?? '',
    kpis: (rawDataRecord.kpis as string) ?? '',
    clarificationQA,
    skeleton,
    skeletonApproved: campaign.skeleton_approved_by_user,
  }
}

export function useCampaignWizard(workspaceId: string, initialState?: Partial<WizardState>) {
  const [state, setState] = useState<WizardState>({
    ...INITIAL_STATE,
    ...initialState,
  })

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }))
  }, [])

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isLoading: false }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardStep,
      error: undefined,
    }))
  }, [])

  const submitStep1 = useCallback(
    async (template: Template, name: string, rawData: Record<string, unknown>) => {
      setLoading(true)
      try {
        const campaignId = await initializeCampaign({
          workspaceId,
          templateId: template.id,
          name,
          rawData,
        })

        setState((prev) => ({
          ...prev,
          step: 2,
          campaignId,
          selectedTemplate: template,
          campaignName: name,
          rawData,
          isLoading: false,
          error: undefined,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      }
    },
    [workspaceId, setLoading, setError],
  )

  const submitStep2 = useCallback(
    async (input: { objectives: string; audience: string; kpis: string }) => {
      if (!state.campaignId || !state.selectedTemplate) return
      setLoading(true)
      try {
        const mergedRawData: Record<string, unknown> = {
          ...state.rawData,
          objectives: input.objectives,
          audience: input.audience,
          kpis: input.kpis,
        }

        await saveCampaignObjectives({
          campaignId: state.campaignId,
          rawData: mergedRawData,
        })

        const qa = await generateClarificationQuestions({
          workspaceId,
          campaignName: state.campaignName,
          rawData: mergedRawData,
          templateName: state.selectedTemplate.name,
        })

        setState((prev) => ({
          ...prev,
          step: 3,
          rawData: mergedRawData,
          objectives: input.objectives,
          audience: input.audience,
          kpis: input.kpis,
          clarificationQA: qa,
          isLoading: false,
          error: undefined,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde des objectifs')
      }
    },
    [
      state.campaignId,
      state.selectedTemplate,
      state.campaignName,
      state.rawData,
      workspaceId,
      setLoading,
      setError,
    ],
  )

  const submitStep3 = useCallback(
    async (qa: ClarificationQA[]) => {
      if (!state.campaignId) return
      setLoading(true)
      try {
        await saveClarificationAnswers({ campaignId: state.campaignId, qa })

        const skeleton = await generateEditorialSkeleton({
          workspaceId,
          campaignName: state.campaignName,
          rawData: state.rawData,
          clarifications: qa,
        })

        setState((prev) => ({
          ...prev,
          step: 4,
          clarificationQA: qa,
          skeleton,
          isLoading: false,
          error: undefined,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      }
    },
    [state.campaignId, state.campaignName, state.rawData, workspaceId, setLoading, setError],
  )

  const submitStep4 = useCallback(
    async (skeleton: EditorialSkeleton) => {
      if (!state.campaignId) return
      setLoading(true)
      try {
        await approveSkeleton({ campaignId: state.campaignId, skeleton })

        const content = await generateContent({
          workspaceId,
          campaignName: state.campaignName,
          skeleton,
        })

        setState((prev) => ({
          ...prev,
          step: 5,
          skeleton,
          skeletonApproved: true,
          generatedContent: content,
          isLoading: false,
          error: undefined,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
      }
    },
    [state.campaignId, state.campaignName, workspaceId, setLoading, setError],
  )

  const submitStep5 = useCallback((finalEdits: Record<string, Partial<GeneratedPost>>) => {
    setState((prev) => ({ ...prev, step: 6, finalEdits }))
  }, [])

  const submitStep6 = useCallback(async (): Promise<boolean> => {
    if (!state.campaignId) return false
    setLoading(true)
    try {
      await saveGeneratedContent({
        campaignId: state.campaignId,
        content: state.generatedContent,
        finalEdits: state.finalEdits,
      })
      setState((prev) => ({ ...prev, isLoading: false, error: undefined, isComplete: true }))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la finalisation')
      return false
    }
  }, [state.campaignId, state.generatedContent, state.finalEdits, setLoading, setError])

  const restartFromStep = useCallback((step: WizardStep) => {
    setState((prev) => ({
      ...prev,
      step,
      isComplete: false,
      error: undefined,
    }))
  }, [])

  return {
    state,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    submitStep5,
    submitStep6,
    goBack,
    reset,
    restartFromStep,
  }
}
