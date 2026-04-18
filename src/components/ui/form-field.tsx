import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  meta?: React.ReactNode
}

function FormField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  meta,
  className,
  children,
  ...props
}: FormFieldProps) {
  const describedById = React.useId()
  const errorId = error ? `${describedById}-error` : undefined
  const hintId = hint ? `${describedById}-hint` : undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {(label || meta) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <Label htmlFor={htmlFor}>
              {label}
              {required && (
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              )}
            </Label>
          )}
          {meta && <span className="text-meta text-muted-foreground">{meta}</span>}
        </div>
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id:
              ((children as React.ReactElement<Record<string, unknown>>).props
                .id as string | undefined) ?? htmlFor,
            "aria-invalid": error ? true : undefined,
            "aria-describedby":
              [errorId, hintId].filter(Boolean).join(" ") || undefined,
          })
        : children}

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }
