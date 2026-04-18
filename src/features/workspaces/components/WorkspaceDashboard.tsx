'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CampaignHistory } from '@/features/campaigns/components/CampaignHistory'
import { CampaignWizard } from '@/features/campaigns/components/CampaignWizard'
import { WorkspaceSettings } from './WorkspaceSettings'
import type { Campaign, EditorialCharter, Template, Workspace } from '@/types/database'
import { PlusIcon } from 'lucide-react'

interface WorkspaceDashboardProps {
  workspace: Workspace
  campaigns: Campaign[]
  templates: Template[]
  charter: EditorialCharter | null
}

const BORDER = 'hsl(222, 15%, 18%)'
const TEXT = 'hsl(210, 20%, 94%)'
const TEXT_MUTED = 'hsl(215, 12%, 50%)'
const ACCENT = 'hsl(235, 80%, 62%)'

export function WorkspaceDashboard({
  workspace,
  campaigns,
  templates,
  charter,
}: WorkspaceDashboardProps) {
  const [wizardOpen, setWizardOpen] = useState(false)

  function handleOpenCampaign(_id: string) {}

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-7 py-5 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight" style={{ color: TEXT }}>
            {workspace.name}
          </h1>
          <p className="text-xs mt-0.5 font-normal" style={{ color: TEXT_MUTED }}>
            {workspace.type === 'Personal' ? 'Profil personnel' : 'Association'}
          </p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="gap-2 text-xs font-medium h-8 px-3.5 rounded-md transition-all hover:scale-[1.02]"
          style={{
            background: ACCENT,
            color: '#fff',
            border: 'none',
            boxShadow: `0 1px 12px hsl(235, 80%, 62%, 0.35)`,
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Nouvelle campagne
        </Button>
      </header>

      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList
          className="rounded-none px-6 gap-0 h-auto pb-0"
          style={{
            background: 'transparent',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <TabsTrigger
            value="campaigns"
            className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium transition-colors"
            style={{
              color: TEXT_MUTED,
            }}
          >
            Campagnes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium transition-colors"
            style={{
              color: TEXT_MUTED,
            }}
          >
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="flex-1 p-7 mt-0">
          <CampaignHistory campaigns={campaigns} onOpenCampaign={handleOpenCampaign} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-7 mt-0 overflow-auto">
          <WorkspaceSettings workspace={workspace} templates={templates} charter={charter} />
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
