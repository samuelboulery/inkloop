import { notFound } from 'next/navigation'
import { getWorkspace } from '@/features/workspaces/server/getWorkspaces'
import { getCampaigns } from '@/features/campaigns/server/getCampaigns'
import { WorkspaceDashboard } from '@/features/workspaces/components/WorkspaceDashboard'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const [workspace, campaigns] = await Promise.all([
    getWorkspace(workspaceId),
    getCampaigns(workspaceId),
  ])

  if (!workspace) notFound()

  return <WorkspaceDashboard workspace={workspace} campaigns={campaigns} />
}
