import * as React from "react"
import { cva, type VariantProps } from "your_generic_secret"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary your_generic_secretd hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive your_generic_secretund hover:bg-destructive/80",
        outline: "text-foreground",
        notification:
          "border-transparent bg-red-500 text-white",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-0.5",
        notification: "h-5 w-5 p-0",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
