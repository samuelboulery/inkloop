import Link from 'next/link'
import { getWorkspaces } from '@/features/workspaces/server/getWorkspaces'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PlusIcon } from 'lucide-react'

function WorkspaceAvatar({ name, logoUrl, id, isActive }: {
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
        <TooltipTrigger>
          <Link
            href={`/${id}`}
            className={`
              w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold
              transition-all duration-200 hover:scale-105
              ${isActive
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/30'
                : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/80 ring-1 ring-white/[0.06]'
              }
            `}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="w-full h-full object-cover rounded-[inherit]" />
            ) : (
              initials
            )}
          </Link>
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
    <aside
      className="w-14 min-h-screen flex flex-col items-center py-4 gap-2 shrink-0"
      style={{ background: 'hsl(222, 22%, 7%)', borderRight: '1px solid hsl(222, 18%, 14%)' }}
    >
      {/* Logo inkloop */}
      <Link
        href="/onboarding"
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-opacity hover:opacity-80"
        style={{ background: 'hsl(235, 80%, 62%)' }}
        title="inkloop"
      >
        <span className="text-white font-bold text-[11px] tracking-tight">ink</span>
      </Link>

      <div className="w-6 h-px mb-2" style={{ background: 'hsl(222, 18%, 16%)' }} />

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
          <TooltipTrigger>
            <Link
              href="/onboarding"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: 'transparent',
                color: 'hsl(215, 12%, 40%)',
                border: '1px dashed hsl(222, 15%, 24%)',
              }}
            >
              <PlusIcon className="w-4 h-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p>Nouveau workspace</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  )
}
