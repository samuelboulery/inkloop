import * as React from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type ButtonProps = React.ComponentProps<typeof Button>

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(loading && "text-meta", className)}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          {loadingText ?? "Chargement…"}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export { LoadingButton }
export type { LoadingButtonProps }
