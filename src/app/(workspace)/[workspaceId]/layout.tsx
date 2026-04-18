import { CommandPalette } from '@/components/CommandPalette'
import { Sidebar } from '@/components/Sidebar'
import { getCampaigns } from '@/features/campaigns/server/getCampaigns'
import { getWorkspaces } from '@/features/workspaces/server/getWorkspaces'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const [workspaces, campaigns] = await Promise.all([
    getWorkspaces(),
    getCampaigns(workspaceId),
  ])

  return (
    <div className="bg-background flex min-h-screen">
      <Sidebar activeWorkspaceId={workspaceId} />
      <main className="flex-1 overflow-auto">{children}</main>
      <CommandPalette
        workspaces={workspaces}
        workspaceId={workspaceId}
        campaigns={campaigns}
      />
    </div>
  )
}
