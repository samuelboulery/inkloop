import { notFound } from 'next/navigation'
import { getWorkspace } from '@/features/workspaces/server/getWorkspaces'
import { getCampaigns } from '@/features/campaigns/server/getCampaigns'
import { getTemplates } from '@/features/templates/server/getTemplates'
import { getCharter } from '@/features/charters/server/getCharter'
import { WorkspaceDashboard } from '@/features/workspaces/components/WorkspaceDashboard'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const [workspace, campaigns, templates, charter] = await Promise.all([
    getWorkspace(workspaceId),
    getCampaigns(workspaceId),
    getTemplates(workspaceId),
    getCharter(workspaceId),
  ])

  if (!workspace) notFound()

  return (
    <WorkspaceDashboard
      workspace={workspace}
      campaigns={campaigns}
      templates={templates}
      charter={charter}
    />
  )
}
