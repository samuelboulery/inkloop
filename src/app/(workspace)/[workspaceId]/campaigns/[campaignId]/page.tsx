import { notFound } from 'next/navigation'
import { getCampaign } from '@/features/campaigns/server/getCampaign'
import { CampaignDetailPage } from '@/features/campaigns/components/CampaignDetailPage'

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ workspaceId: string; campaignId: string }>
}) {
  const { workspaceId, campaignId } = await params
  const campaign = await getCampaign(campaignId, workspaceId)
  if (!campaign) notFound()
  return <CampaignDetailPage campaign={campaign} workspaceId={workspaceId} />
}
