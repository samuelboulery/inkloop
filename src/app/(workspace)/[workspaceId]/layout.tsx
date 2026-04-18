import { Sidebar } from '@/components/Sidebar'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  return (
    <div className="flex min-h-screen" style={{ background: 'hsl(222, 20%, 8%)' }}>
      <Sidebar activeWorkspaceId={workspaceId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
