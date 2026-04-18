'use client'

import type { ReactNode } from 'react'

interface SettingsPanelProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function SettingsPanel({ title, description, actions, children }: SettingsPanelProps) {
  return (
    <section className="rounded-xl overflow-hidden bg-surface-1 border border-border">
      <header className="px-5 py-4 flex items-start justify-between gap-4 border-b border-border">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="text-xs mt-0.5 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
