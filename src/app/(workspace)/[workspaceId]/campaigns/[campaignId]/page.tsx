import { notFound } from 'next/navigation'
import { getCampaign } from '@/features/campaigns/server/getCampaign'
import { getWorkspace } from '@/features/workspaces/server/getWorkspaces'
import { CampaignDetailPage } from '@/features/campaigns/components/CampaignDetailPage'

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ workspaceId: string; campaignId: string }>
}) {
  const { workspaceId, campaignId } = await params
  const [campaign, workspace] = await Promise.all([
    getCampaign(campaignId, workspaceId),
    getWorkspace(workspaceId),
  ])
  if (!campaign) notFound()
  const campaignTargets = Array.isArray(workspace?.campaign_targets)
    ? (workspace.campaign_targets as string[])
    : []
  return (
    <CampaignDetailPage
      campaign={campaign}
      workspaceId={workspaceId}
      campaignTargets={campaignTargets}
    />
  )
}
