'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Campaign } from '@/types/database'
import { useCampaignWizard, campaignToInitialWizardState } from '../hooks/useCampaignWizard'
import type { WizardState } from '../hooks/useCampaignWizard'
import { StepTemplateSelect } from './steps/StepTemplateSelect'
import { StepObjectives } from './steps/StepObjectives'
import { StepClarification } from './steps/StepClarification'
import { StepSkeleton } from './steps/StepSkeleton'
import { StepGeneration } from './steps/StepGeneration'
import { StepReview } from './steps/StepReview'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'
import { CheckIcon, AlertCircleIcon } from 'lucide-react'

const STEP_LABELS = ['Template', 'Objectifs', 'Clarification', 'Squelette', 'Contenu', 'Révision']

type StepNum = 1 | 2 | 3 | 4 | 5 | 6

interface Props {
  workspaceId: string
  resumeCampaign?: Campaign
  wizardInitialState?: Partial<WizardState>
  campaignTargets?: string[]
  onComplete?: (campaignId: string) => void
}

export function CampaignWizard({
  workspaceId,
  resumeCampaign,
  wizardInitialState,
  campaignTargets,
  onComplete,
}: Props) {
  const router = useRouter()
  const derivedInitialState = resumeCampaign
    ? campaignToInitialWizardState(resumeCampaign)
    : undefined
  const initialState = wizardInitialState ?? derivedInitialState
  const {
    state,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    submitStep5,
    submitStep6,
    goBack,
  } = useCampaignWizard(workspaceId, initialState)

  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishedCampaign, setPublishedCampaign] = useState<
    { id: string; name: string } | undefined
  >(undefined)

  async function handleFinalSubmit() {
    const ok = await submitStep6()
    if (ok && state.campaignId) {
      router.refresh()
      onComplete?.(state.campaignId)
    }
  }

  async function handleFinalSubmitAndPublish() {
    if (!state.campaignId) return
    const ok = await submitStep6()
    if (ok && state.campaignId && state.campaignName) {
      setPublishedCampaign({ id: state.campaignId, name: state.campaignName })
      setPublishDialogOpen(true)
      router.refresh()
    }
  }

  function handlePublishDialogChange(next: boolean) {
    setPublishDialogOpen(next)
    if (!next && state.campaignId) {
      setPublishedCampaign(undefined)
      onComplete?.(state.campaignId)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stepper — mobile: progress bar in DM Mono; desktop: circles + lines */}
      <div className="mb-8 shrink-0">
        {/* Mobile */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-meta text-foreground">
              [{String(state.step).padStart(2, '0')} / {String(STEP_LABELS.length).padStart(2, '0')}
              ]
            </span>
            <span className="text-meta text-muted-foreground">{STEP_LABELS[state.step - 1]}</span>
          </div>
          <div className="h-px w-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${(state.step / STEP_LABELS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-0">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as StepNum
            const isActive = state.step === stepNum
            const isDone = state.step > stepNum
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold transition-all duration-200 ${
                      isDone
                        ? 'bg-foreground text-background'
                        : isActive
                          ? 'bg-background text-foreground border-[1.5px] border-foreground ring-[3px] ring-foreground/10'
                          : 'bg-muted text-muted-foreground/60 border border-border'
                    }`}
                  >
                    {isDone ? <CheckIcon className="w-3 h-3" /> : String(stepNum).padStart(2, '0')}
                  </div>
                  <span
                    className={`text-meta mt-1.5 transition-colors duration-200 ${
                      isActive
                        ? 'text-foreground'
                        : isDone
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/60'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-1 transition-all duration-300 ${
                      state.step > stepNum ? 'bg-foreground' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="rounded-lg px-4 py-3 mb-4 shrink-0 flex items-start gap-2.5 animate-scale-in bg-destructive/5 border border-destructive/20">
          <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="overflow-y-auto flex-1">
        <div key={state.step} className="animate-fade-up">
          {state.step === 1 && (
            <StepTemplateSelect
              workspaceId={workspaceId}
              onSubmit={submitStep1}
              isLoading={state.isLoading}
            />
          )}
          {state.step === 2 && (
            <StepObjectives
              initialObjectives={state.objectives}
              initialAudience={state.audience}
              initialTargets={state.targets}
              initialKpis={state.kpis}
              availableTargets={campaignTargets}
              onSubmit={submitStep2}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
          {state.step === 3 && (
            <StepClarification
              qa={state.clarificationQA}
              onSubmit={submitStep3}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
          {state.step === 4 && (
            <StepSkeleton
              skeleton={state.skeleton}
              onSubmit={submitStep4}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
          {state.step === 5 && (
            <StepGeneration
              generatedContent={state.generatedContent}
              onSubmit={submitStep5}
              onBack={goBack}
            />
          )}
          {state.step === 6 && (
            <StepReview
              campaignId={state.campaignId}
              campaignName={state.campaignName}
              workspaceId={workspaceId}
              skeleton={state.skeleton}
              generatedContent={state.generatedContent}
              finalEdits={state.finalEdits}
              onSubmit={handleFinalSubmit}
              onSubmitAndPublish={handleFinalSubmitAndPublish}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
        </div>
      </div>

      {publishedCampaign && (
        <PublishingDialog
          campaignId={publishedCampaign.id}
          campaignName={publishedCampaign.name}
          open={publishDialogOpen}
          onOpenChange={handlePublishDialogChange}
        />
      )}
    </div>
  )
}
