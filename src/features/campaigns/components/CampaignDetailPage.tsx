'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { CampaignWizard } from './CampaignWizard'
import { CampaignResults } from './CampaignResults'
import { campaignToInitialWizardState } from '../hooks/useCampaignWizard'
import type { Campaign } from '@/types/database'
import type { WizardStep } from '../hooks/useCampaignWizard'

interface CampaignDetailPageProps {
  campaign: Campaign
  workspaceId: string
  campaignTargets?: string[]
}

function hasGeneratedContent(campaign: Campaign): boolean {
  const content = campaign.generated_content
  if (!content || typeof content !== 'object') return false
  return Object.keys(content).length > 0
}

export function CampaignDetailPage({
  campaign,
  workspaceId,
  campaignTargets,
}: CampaignDetailPageProps) {
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
    <div className="flex flex-col h-full min-h-screen bg-background text-foreground animate-fade-in">
      {/* Top bar */}
      <header className="relative z-10 px-6 py-4 flex items-center gap-3 shrink-0 border-b border-border">
        <Link
          href={`/${workspaceId}`}
          className="inline-flex items-center gap-1.5 text-xs h-8 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour
        </Link>
        <span className="text-[11px] text-border">/</span>
        <span className="text-sm font-medium truncate text-foreground">{campaign.name}</span>
        <span
          className={
            mode === 'wizard'
              ? 'text-meta ml-auto px-2 py-0.5 rounded-md bg-secondary text-foreground'
              : 'text-meta ml-auto px-2 py-0.5 rounded-md text-muted-foreground'
          }
        >
          {mode === 'wizard' ? 'Wizard' : 'Résultats'}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 overflow-hidden animate-fade-up">
        {mode === 'wizard' ? (
          <CampaignWizard
            workspaceId={workspaceId}
            resumeCampaign={resumeCampaign}
            wizardInitialState={wizardInitialState}
            campaignTargets={campaignTargets}
            onComplete={handleWizardComplete}
          />
        ) : (
          <CampaignResults campaign={campaign} onRestart={handleRestart} />
        )}
      </main>
    </div>
  )
}
