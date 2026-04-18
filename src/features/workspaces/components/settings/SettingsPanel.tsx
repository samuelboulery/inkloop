'use client'

import type { ReactNode } from 'react'
import { theme } from '@/lib/ui/theme'

interface SettingsPanelProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function SettingsPanel({ title, description, actions, children }: SettingsPanelProps) {
  return (
    <section
      className="rounded-xl overflow-hidden"
      style={{ background: theme.SURFACE, border: `1px solid ${theme.BORDER}` }}
    >
      <header
        className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ borderBottom: `1px solid ${theme.BORDER}` }}
      >
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: theme.TEXT }}>
            {title}
          </h3>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: theme.TEXT_MUTED }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
