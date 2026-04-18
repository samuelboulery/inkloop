'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CampaignHistory } from '@/features/campaigns/components/CampaignHistory'
import { WorkspaceSettings } from './WorkspaceSettings'
import type { Campaign, EditorialCharter, Template, Workspace } from '@/types/database'
import { PlusIcon } from 'lucide-react'

interface WorkspaceDashboardProps {
  workspace: Workspace
  campaigns: Campaign[]
  templates: Template[]
  charter: EditorialCharter | null
}

export function WorkspaceDashboard({
  workspace,
  campaigns: initialCampaigns,
  templates,
  charter,
}: WorkspaceDashboardProps) {
  const router = useRouter()

  function handleOpenCampaign(id: string) {
    router.push(`/${workspace.id}/campaigns/${id}`)
  }

  function handleNewCampaign() {
    router.push(`/${workspace.id}/campaigns/new`)
  }

  return (
    <div className="flex flex-col h-full animate-fade-up">
      <header className="px-7 py-5 flex items-center justify-between shrink-0 border-b border-border">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
            {workspace.name}
          </h1>
          <p className="text-meta mt-1 text-muted-foreground">
            {workspace.type === 'Personal' ? 'Profil personnel' : 'Association'}
          </p>
        </div>
        <Button
          onClick={handleNewCampaign}
          size="sm"
          className="gap-2 active:scale-[0.98]"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Nouvelle campagne
        </Button>
      </header>

      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList className="rounded-none px-6 gap-0 h-auto pb-0 w-full justify-start bg-transparent border-b border-border">
          <TabsTrigger
            value="campaigns"
            className="rounded-none border-b-2 border-transparent data-active:border-foreground data-active:bg-transparent px-4 py-3 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground/80 data-active:text-foreground"
          >
            Campagnes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent data-active:border-foreground data-active:bg-transparent px-4 py-3 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground/80 data-active:text-foreground"
          >
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="flex-1 p-7 mt-0">
          <CampaignHistory campaigns={initialCampaigns} onOpenCampaign={handleOpenCampaign} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-7 mt-0 overflow-auto">
          <WorkspaceSettings workspace={workspace} templates={templates} charter={charter} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
