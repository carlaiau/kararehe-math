import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-[transform,background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 active:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_5px_0_var(--primary-shadow)] hover:-translate-y-0.5 hover:bg-primary/92",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_4px_0_var(--secondary-shadow)] hover:-translate-y-0.5 hover:bg-secondary/85",
        outline: "border-2 border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        danger: "bg-destructive/10 text-destructive border-2 border-destructive/20 hover:bg-destructive/15",
      },
      size: {
        default: "min-h-12 px-5 py-3 text-base",
        lg: "min-h-16 px-7 py-4 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
