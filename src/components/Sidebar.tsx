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
              w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold
              transition-all duration-150 hover:rounded-2xl
              ${isActive
                ? 'bg-indigo-600 text-white rounded-2xl'
                : 'bg-gray-700 text-gray-300 hover:bg-indigo-500 hover:text-white'
              }
            `}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="w-full h-full object-cover rounded-inherit" />
            ) : (
              initials
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export async function Sidebar({ activeWorkspaceId }: { activeWorkspaceId?: string }) {
  const workspaces = await getWorkspaces()

  return (
    <aside className="w-16 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4 gap-2">
      {/* Logo inkloop */}
      <Link href="/onboarding" className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-2">
        <span className="text-white font-bold text-sm">IL</span>
      </Link>

      <div className="w-8 h-px bg-gray-800 mb-2" />

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
              className="w-10 h-10 rounded-xl bg-gray-800 text-gray-400 hover:bg-indigo-500 hover:text-white flex items-center justify-center transition-all hover:rounded-2xl"
            >
              <PlusIcon className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Nouveau workspace</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  )
}
