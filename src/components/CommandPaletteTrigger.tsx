'use client'

import { SearchIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function CommandPaletteTrigger() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent('inkloop:open-command-palette'))
  }

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          onClick={handleClick}
          aria-label="Ouvrir la palette de commandes"
          className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground ring-border flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-all duration-200 hover:scale-105"
        >
          <SearchIcon className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <p>Recherche rapide · ⌘K</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
