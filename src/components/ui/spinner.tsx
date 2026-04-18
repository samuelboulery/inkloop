import { Loader2Icon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin shrink-0", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

function Spinner({ className, size, label = "Chargement", ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
