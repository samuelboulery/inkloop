'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRightIcon,
  FolderIcon,
  HomeIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
} from 'lucide-react'
import type { Campaign, Workspace } from '@/types/database'

interface CommandPaletteProps {
  workspaces: Workspace[]
  workspaceId: string
  campaigns: Campaign[]
}

const STATUS_LABELS: Record<Campaign['status'], string> = {
  Draft: 'Brouillon',
  InProgress: 'En cours',
  Ready: 'Prête',
  Sent: 'Publiée',
}

export function CommandPalette({ workspaces, workspaceId, campaigns }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleOpen() {
      setOpen(true)
    }
    window.addEventListener('inkloop:open-command-palette', handleOpen)
    return () => window.removeEventListener('inkloop:open-command-palette', handleOpen)
  }, [])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const activeWorkspace = workspaces.find((ws) => ws.id === workspaceId)

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Recherche globale inkloop"
      overlayClassName="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      contentClassName="fixed top-[15vh] left-1/2 z-50 w-[min(640px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_24px_60px_-20px_rgba(10,10,10,0.25)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <SearchIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
        <Command.Input
          placeholder="Rechercher un workspace, une campagne, une action…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <kbd className="text-meta hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground sm:inline-block">
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[60vh] overflow-y-auto px-2 py-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
          Aucun résultat.
        </Command.Empty>

        <Command.Group
          heading="Actions"
          className="text-meta px-2 pt-2 text-muted-foreground [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5"
        >
          <PaletteItem
            value="action nouvelle campagne créer"
            icon={<PlusIcon className="h-4 w-4" />}
            label="Nouvelle campagne"
            hint="Démarrer un brief multi-réseaux"
            shortcut="N"
            onSelect={() => navigate(`/${workspaceId}/campaigns/new`)}
          />
          <PaletteItem
            value="action retour dashboard accueil"
            icon={<HomeIcon className="h-4 w-4" />}
            label="Tableau de bord"
            hint={activeWorkspace?.name ?? 'Workspace courant'}
            onSelect={() => navigate(`/${workspaceId}`)}
          />
          <PaletteItem
            value="action paramètres settings reglages"
            icon={<SettingsIcon className="h-4 w-4" />}
            label="Paramètres du workspace"
            hint="Charte, templates, prompts, cibles"
            onSelect={() => navigate(`/${workspaceId}#settings`)}
          />
        </Command.Group>

        {campaigns.length > 0 && (
          <Command.Group
            heading="Campagnes"
            className="text-meta mt-2 px-2 pt-2 text-muted-foreground [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5"
          >
            {campaigns.slice(0, 12).map((campaign) => (
              <PaletteItem
                key={campaign.id}
                value={`campagne ${campaign.name} ${STATUS_LABELS[campaign.status]}`}
                icon={<SparklesIcon className="h-4 w-4" />}
                label={campaign.name}
                hint={STATUS_LABELS[campaign.status]}
                onSelect={() =>
                  navigate(`/${workspaceId}/campaigns/${campaign.id}`)
                }
              />
            ))}
          </Command.Group>
        )}

        {workspaces.length > 1 && (
          <Command.Group
            heading="Workspaces"
            className="text-meta mt-2 px-2 pt-2 text-muted-foreground [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5"
          >
            {workspaces.map((ws) => (
              <PaletteItem
                key={ws.id}
                value={`workspace ${ws.name} ${ws.type}`}
                icon={<FolderIcon className="h-4 w-4" />}
                label={ws.name}
                hint={ws.type === 'Personal' ? 'Profil personnel' : 'Association'}
                trailing={
                  ws.id === workspaceId ? (
                    <span className="text-meta text-muted-foreground">Actif</span>
                  ) : undefined
                }
                onSelect={() => navigate(`/${ws.id}`)}
              />
            ))}
          </Command.Group>
        )}
      </Command.List>

      <div className="text-meta flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.625rem]">
            ↑↓
          </kbd>
          Naviguer
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.625rem]">
            ⏎
          </kbd>
          Sélectionner
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.625rem]">
            ⌘K
          </kbd>
          Ouvrir / fermer
        </span>
      </div>
    </Command.Dialog>
  )
}

interface PaletteItemProps {
  value: string
  icon: React.ReactNode
  label: string
  hint?: string
  shortcut?: string
  trailing?: React.ReactNode
  onSelect: () => void
}

function PaletteItem({ value, icon, label, hint, shortcut, trailing, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
    >
      <span className="text-muted-foreground group-data-[selected=true]:text-foreground">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <span className="hidden truncate text-xs text-muted-foreground sm:inline">{hint}</span>
      )}
      {shortcut && (
        <kbd className="text-meta rounded border border-border bg-background px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
          {shortcut}
        </kbd>
      )}
      {trailing}
      <ArrowRightIcon className="h-3.5 w-3.5 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
    </Command.Item>
  )
}
