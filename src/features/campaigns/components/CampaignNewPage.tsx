'use client'

import { useRouter } from 'next/navigation'
import { CampaignWizard } from './CampaignWizard'

interface CampaignNewPageProps {
  workspaceId: string
  campaignTargets?: string[]
}

export function CampaignNewPage({ workspaceId, campaignTargets }: CampaignNewPageProps) {
  const router = useRouter()

  function handleComplete(campaignId: string) {
    router.push(`/${workspaceId}/campaigns/${campaignId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignWizard
        workspaceId={workspaceId}
        campaignTargets={campaignTargets}
        onComplete={handleComplete}
      />
    </div>
  )
}
