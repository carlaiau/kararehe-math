import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[2rem] border-2 border-border bg-card text-card-foreground shadow-[0_10px_30px_rgb(59_67_45_/_0.08)]", className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-3 sm:p-8 sm:pb-4", className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-3 sm:p-8 sm:pt-4", className)} {...props} />
}
