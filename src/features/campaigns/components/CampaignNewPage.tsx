'use client'

import { useRouter } from 'next/navigation'
import { CampaignWizard } from './CampaignWizard'

interface CampaignNewPageProps {
  workspaceId: string
}

export function CampaignNewPage({ workspaceId }: CampaignNewPageProps) {
  const router = useRouter()

  function handleComplete(campaignId: string) {
    router.push(`/${workspaceId}/campaigns/${campaignId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignWizard workspaceId={workspaceId} onComplete={handleComplete} />
    </div>
  )
}
