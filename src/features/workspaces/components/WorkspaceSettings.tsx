'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneralSettings } from './settings/GeneralSettings'
import { NetworksSettings } from './settings/NetworksSettings'
import { TemplatesEditor } from './settings/TemplatesEditor'
import { CharterEditor } from './settings/CharterEditor'
import { PromptsEditor } from './settings/PromptsEditor'
import { theme } from '@/lib/ui/theme'
import type { EditorialCharter, Template, Workspace } from '@/types/database'

interface WorkspaceSettingsProps {
  workspace: Workspace
  templates: Template[]
  charter: EditorialCharter | null
}

const TABS = [
  { value: 'general', label: 'Général' },
  { value: 'networks', label: 'Réseaux' },
  { value: 'templates', label: 'Templates' },
  { value: 'charter', label: 'Charte' },
  { value: 'prompts', label: 'Prompts' },
] as const

export function WorkspaceSettings({ workspace, templates, charter }: WorkspaceSettingsProps) {
  return (
    <div className="max-w-3xl">
      <Tabs defaultValue="general" className="flex flex-col gap-5">
        <TabsList
          variant="line"
          className="rounded-none gap-0 h-auto px-0"
          style={{
            background: 'transparent',
            borderBottom: `1px solid ${theme.BORDER}`,
          }}
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-medium transition-colors"
              style={{ color: theme.TEXT_MUTED }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <GeneralSettings workspace={workspace} />
        </TabsContent>

        <TabsContent value="networks" className="mt-0">
          <NetworksSettings workspace={workspace} />
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <TemplatesEditor workspaceId={workspace.id} templates={templates} />
        </TabsContent>

        <TabsContent value="charter" className="mt-0">
          <CharterEditor workspaceId={workspace.id} charter={charter} />
        </TabsContent>

        <TabsContent value="prompts" className="mt-0">
          <PromptsEditor workspace={workspace} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
