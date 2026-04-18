import * as React from 'react'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs animate-scale-in',
  {
    variants: {
      variant: {
        info: 'bg-muted/40 border-border text-foreground',
        success: 'bg-status-ready/10 border-status-ready/30 text-status-ready',
        warning: 'bg-status-progress/10 border-status-progress/30 text-status-progress',
        error: 'bg-destructive/5 border-destructive/20 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

const ICON_MAP: Record<NonNullable<AlertVariant>, LucideIcon> = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: TriangleAlertIcon,
  error: AlertCircleIcon,
}

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>

interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof alertVariants> {
  icon?: LucideIcon | false
  title?: React.ReactNode
}

function Alert({ className, variant = 'info', icon, title, children, ...props }: AlertProps) {
  const resolvedVariant = (variant ?? 'info') as AlertVariant
  const Icon = icon === false ? null : (icon ?? ICON_MAP[resolvedVariant])
  const role = resolvedVariant === 'error' ? 'alert' : 'status'
  const ariaLive = resolvedVariant === 'error' ? 'assertive' : 'polite'

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cn(alertVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        {children && <div className="text-xs">{children}</div>}
      </div>
    </div>
  )
}

export { Alert, alertVariants }
export type { AlertProps, AlertVariant }
