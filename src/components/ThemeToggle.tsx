'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'inkloop-theme'

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e: MediaQueryListEvent) {
      if (readStoredTheme() !== null) return
      setTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  function toggle() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const isDark = theme === 'dark'
  const label = isDark ? 'Mode clair' : 'Mode sombre'

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          onClick={toggle}
          aria-label={label}
          aria-pressed={isDark}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 bg-transparent text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
        >
          {mounted && isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
