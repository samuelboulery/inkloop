'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCampaignWizard } from '../hooks/useCampaignWizard'
import { StepTemplateSelect } from './steps/StepTemplateSelect'
import { StepClarification } from './steps/StepClarification'
import { StepSkeleton } from './steps/StepSkeleton'
import { StepGeneration } from './steps/StepGeneration'
import { StepReview } from './steps/StepReview'

const STEP_LABELS = [
  'Template',
  'Clarification',
  'Squelette',
  'Contenu',
  'Révision',
]

interface Props {
  workspaceId: string
  open: boolean
  onClose: () => void
}

export function CampaignWizard({ workspaceId, open, onClose }: Props) {
  const router = useRouter()
  const { state, submitStep1, submitStep2, submitStep3, submitStep4, submitStep5, goBack, reset } =
    useCampaignWizard(workspaceId)

  async function handleClose() {
    reset()
    onClose()
  }

  async function handleStep5Submit() {
    const ok = await submitStep5()
    if (ok) {
      router.refresh()
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Nouvelle campagne</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-6 shrink-0">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5
            const isActive = state.step === stepNum
            const isDone = state.step > stepNum
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      isDone
                        ? 'bg-indigo-600 text-white'
                        : isActive
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span
                    className={`text-xs mt-1 hidden sm:block ${
                      isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-1 transition-colors ${
                      state.step > stepNum ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Error banner */}
        {state.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 mb-4 shrink-0">
            <p className="text-red-400 text-sm">{state.error}</p>
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
            <StepClarification
              qa={state.clarificationQA}
              onSubmit={submitStep2}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
          {state.step === 3 && (
            <StepSkeleton
              skeleton={state.skeleton}
              onSubmit={submitStep3}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
          {state.step === 4 && (
            <StepGeneration
              generatedContent={state.generatedContent}
              onSubmit={submitStep4}
              onBack={goBack}
            />
          )}
          {state.step === 5 && (
            <StepReview
              campaignName={state.campaignName}
              skeleton={state.skeleton}
              generatedContent={state.generatedContent}
              finalEdits={state.finalEdits}
              onSubmit={handleStep5Submit}
              onBack={goBack}
              isLoading={state.isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
