import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "text-meta inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap",
  {
    variants: {
      status: {
        draft: "text-muted-foreground bg-muted",
        progress:
          "text-foreground bg-status-progress/15 [&>span[data-dot]]:bg-status-progress [&>span[data-dot]]:animate-progress-pulse",
        ready: "text-foreground bg-status-ready/20",
        sent: "text-background bg-foreground",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
)

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean
}

function StatusBadge({
  status,
  className,
  dot = false,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {dot && (
        <span
          data-dot
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants }
export type { StatusBadgeProps }
