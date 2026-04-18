import Link from 'next/link'
import { getWorkspaces } from '@/features/workspaces/server/getWorkspaces'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PlusIcon } from 'lucide-react'
import { CommandPaletteTrigger } from '@/components/CommandPaletteTrigger'
import { ThemeToggle } from '@/components/ThemeToggle'

function WorkspaceAvatar({
  name,
  logoUrl,
  id,
  isActive,
}: {
  name: string
  logoUrl: string | null
  id: string
  isActive: boolean
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={`/${id}`}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold
                transition-all duration-200 hover:scale-105
                ${
                  isActive
                    ? 'bg-foreground text-background ring-1 ring-foreground/10'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground ring-1 ring-border'
                }
              `}
            />
          }
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={name}
              className="w-full h-full object-cover rounded-[inherit]"
            />
          ) : (
            initials
          )}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export async function Sidebar({ activeWorkspaceId }: { activeWorkspaceId?: string }) {
  const workspaces = await getWorkspaces()

  return (
    <aside className="w-14 min-h-screen flex flex-col items-center py-4 gap-2 shrink-0 animate-fade-in bg-background border-r border-border">
      {/* Logo inkloop */}
      <Link
        href="/onboarding"
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-all duration-200 hover:opacity-75 hover:scale-105 bg-foreground"
        title="inkloop"
      >
        <span className="text-background font-bold text-[11px] tracking-tight">ink</span>
      </Link>

      <div className="w-6 h-px mb-2 bg-border" />

      {/* Workspaces */}
      {workspaces.map((ws) => (
        <WorkspaceAvatar
          key={ws.id}
          id={ws.id}
          name={ws.name}
          logoUrl={ws.logo_url}
          isActive={ws.id === activeWorkspaceId}
        />
      ))}

      {/* Ajouter un workspace */}
      <TooltipProvider delay={300}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/onboarding?new=1"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 bg-transparent text-muted-foreground/70 border border-dashed border-border hover:bg-muted hover:text-foreground hover:border-border"
              />
            }
          >
            <PlusIcon className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p>Nouveau workspace</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="w-6 h-px bg-border" />
        <CommandPaletteTrigger />
        <ThemeToggle />
      </div>
    </aside>
  )
}
