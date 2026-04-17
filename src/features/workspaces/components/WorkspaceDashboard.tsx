'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CampaignHistory } from '@/features/campaigns/components/CampaignHistory'
import { CampaignWizard } from '@/features/campaigns/components/CampaignWizard'
import { WorkspaceSettings } from './WorkspaceSettings'
import type { Workspace } from '@/types/database'
import type { Campaign } from '@/types/database'
import { PlusIcon } from 'lucide-react'

interface WorkspaceDashboardProps {
  workspace: Workspace
  campaigns: Campaign[]
}

export function WorkspaceDashboard({ workspace, campaigns }: WorkspaceDashboardProps) {
  const [wizardOpen, setWizardOpen] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleOpenCampaign(_id: string) {}

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{workspace.name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {workspace.type === 'Personal' ? 'Profil personnel' : 'Association'}
          </p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Nouvelle campagne
        </Button>
      </header>

      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-gray-800 rounded-none px-6 gap-0 h-auto pb-0">
          <TabsTrigger
            value="campaigns"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-4 py-3 text-sm"
          >
            Campagnes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-4 py-3 text-sm"
          >
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="flex-1 p-6 mt-0">
          <CampaignHistory campaigns={campaigns} onOpenCampaign={handleOpenCampaign} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6 mt-0 overflow-auto">
          <WorkspaceSettings workspace={workspace} />
        </TabsContent>
      </Tabs>

      <CampaignWizard
        workspaceId={workspace.id}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  )
}
