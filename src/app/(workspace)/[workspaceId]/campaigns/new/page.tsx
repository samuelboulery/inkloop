import { CampaignNewPage } from '@/features/campaigns/components/CampaignNewPage'
import { getWorkspace } from '@/features/workspaces/server/getWorkspaces'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function CampaignNewRoute({ params }: Props) {
  const { workspaceId } = await params
  const workspace = await getWorkspace(workspaceId)
  const campaignTargets = Array.isArray(workspace?.campaign_targets)
    ? (workspace.campaign_targets as string[])
    : []
  return <CampaignNewPage workspaceId={workspaceId} campaignTargets={campaignTargets} />
}
