'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CampaignWizard } from './CampaignWizard'
import { CampaignResults } from './CampaignResults'
import { campaignToInitialWizardState } from '../hooks/useCampaignWizard'
import type { Campaign } from '@/types/database'
import type { WizardStep } from '../hooks/useCampaignWizard'

interface CampaignDetailPageProps {
  campaign: Campaign
  workspaceId: string
}

function hasGeneratedContent(campaign: Campaign): boolean {
  const content = campaign.generated_content
  if (!content || typeof content !== 'object') return false
  return Object.keys(content).length > 0
}

export function CampaignDetailPage({ campaign, workspaceId }: CampaignDetailPageProps) {
  const router = useRouter()

  const [mode, setMode] = useState<'wizard' | 'results'>(
    hasGeneratedContent(campaign) ? 'results' : 'wizard',
  )

  const [resumeStep, setResumeStep] = useState<WizardStep | undefined>(undefined)

  function handleWizardComplete() {
    setMode('results')
    setResumeStep(undefined)
    router.refresh()
  }

  function handleRestart(step: WizardStep) {
    setResumeStep(step)
    setMode('wizard')
  }

  const resumeCampaign: Campaign | undefined =
    mode === 'wizard' && resumeStep !== undefined
      ? campaign
      : mode === 'wizard' && !hasGeneratedContent(campaign)
        ? campaign
        : undefined

  const wizardInitialState =
    resumeStep !== undefined
      ? { ...campaignToInitialWizardState(campaign), step: resumeStep }
      : undefined

  return (
    <div
      className="flex flex-col h-full min-h-screen"
      style={{ background: 'hsl(222, 18%, 8%)', color: 'hsl(210, 20%, 90%)' }}
    >
      {/* Top bar */}
      <header
        className="px-6 py-4 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid hsl(222, 15%, 16%)' }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${workspaceId}`)}
          className="gap-2 text-xs h-8 px-2"
          style={{ color: 'hsl(215, 12%, 50%)' }}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour
        </Button>
        <span
          className="text-[11px]"
          style={{ color: 'hsl(222, 15%, 30%)' }}
        >
          /
        </span>
        <span className="text-sm font-medium truncate" style={{ color: 'hsl(210, 20%, 80%)' }}>
          {campaign.name}
        </span>
        <span
          className="text-[11px] ml-auto"
          style={{ color: mode === 'wizard' ? 'hsl(235, 80%, 70%)' : 'hsl(215, 12%, 40%)' }}
        >
          {mode === 'wizard' ? 'Wizard' : 'Résultats'}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 overflow-hidden">
        {mode === 'wizard' ? (
          <CampaignWizard
            workspaceId={workspaceId}
            resumeCampaign={resumeCampaign}
            wizardInitialState={wizardInitialState}
            onComplete={handleWizardComplete}
          />
        ) : (
          <CampaignResults
            campaign={campaign}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  )
}
