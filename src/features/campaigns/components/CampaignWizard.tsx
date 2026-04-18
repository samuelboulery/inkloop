'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCampaignWizard } from '../hooks/useCampaignWizard'
import { StepTemplateSelect } from './steps/StepTemplateSelect'
import { StepObjectives } from './steps/StepObjectives'
import { StepClarification } from './steps/StepClarification'
import { StepSkeleton } from './steps/StepSkeleton'
import { StepGeneration } from './steps/StepGeneration'
import { StepReview } from './steps/StepReview'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'

const STEP_LABELS = [
  'Template',
  'Objectifs',
  'Clarification',
  'Squelette',
  'Contenu',
  'Révision',
]

type StepNum = 1 | 2 | 3 | 4 | 5 | 6

interface Props {
  workspaceId: string
  open: boolean
  onClose: () => void
}

export function CampaignWizard({ workspaceId, open, onClose }: Props) {
  const router = useRouter()
  const {
    state,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    submitStep5,
    submitStep6,
    goBack,
    reset,
  } = useCampaignWizard(workspaceId)

  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishedCampaign, setPublishedCampaign] = useState<
    { id: string; name: string } | undefined
  >(undefined)

  async function handleClose() {
    reset()
    onClose()
  }

  async function handleFinalSubmit() {
    const ok = await submitStep6()
    if (ok) {
      router.refresh()
      handleClose()
    }
  }

  async function handleFinalSubmitAndPublish() {
    if (!state.campaignId) return
    const ok = await submitStep6()
    if (ok) {
      setPublishedCampaign({ id: state.campaignId, name: state.campaignName })
      setPublishDialogOpen(true)
      router.refresh()
    }
  }

  function handlePublishDialogChange(next: boolean) {
    setPublishDialogOpen(next)
    if (!next) {
      setPublishedCampaign(undefined)
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="text-white max-w-2xl max-h-[90vh] flex flex-col"
        style={{
          background: 'hsl(222, 18%, 10%)',
          border: '1px solid hsl(222, 15%, 20%)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold" style={{ color: 'hsl(210, 20%, 94%)' }}>
            Nouvelle campagne
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-6 shrink-0">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as StepNum
            const isActive = state.step === stepNum
            const isDone = state.step > stepNum
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all"
                    style={
                      isDone
                        ? { background: 'hsl(235, 80%, 62%)', color: '#fff' }
                        : isActive
                        ? {
                            background: 'hsl(235, 60%, 20%)',
                            color: 'hsl(235, 90%, 78%)',
                            boxShadow: '0 0 0 3px hsl(235, 80%, 62%, 0.2)',
                            border: '1px solid hsl(235, 60%, 38%)',
                          }
                        : {
                            background: 'hsl(222, 18%, 16%)',
                            color: 'hsl(215, 12%, 38%)',
                            border: '1px solid hsl(222, 15%, 22%)',
                          }
                    }
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span
                    className="text-[11px] mt-1 hidden sm:block"
                    style={{
                      color: isActive
                        ? 'hsl(235, 80%, 75%)'
                        : isDone
                        ? 'hsl(215, 12%, 50%)'
                        : 'hsl(215, 10%, 32%)',
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className="h-px flex-1 mx-1 transition-colors"
                    style={{
                      background: state.step > stepNum
                        ? 'hsl(235, 80%, 45%)'
                        : 'hsl(222, 15%, 20%)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Error banner */}
        {state.error && (
          <div
            className="rounded-lg px-4 py-2 mb-4 shrink-0"
            style={{
              background: 'hsl(0, 70%, 20%, 0.2)',
              border: '1px solid hsl(0, 60%, 30%, 0.3)',
            }}
          >
            <p className="text-xs" style={{ color: 'hsl(0, 70%, 65%)' }}>{state.error}</p>
          </div>
        )}

        {/* Step content */}
        <div className="overflow-y-auto flex-1">
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
              initialKpis={state.kpis}
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
      </DialogContent>
      {publishedCampaign && (
        <PublishingDialog
          campaignId={publishedCampaign.id}
          campaignName={publishedCampaign.name}
          open={publishDialogOpen}
          onOpenChange={handlePublishDialogChange}
        />
      )}
    </Dialog>
  )
}
