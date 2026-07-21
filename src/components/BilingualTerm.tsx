import type { BilingualTerm as Term } from "@/language/bilingualTerms"
import { cn } from "@/lib/utils"

export function BilingualTerm({ term, className }: { term: Term; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline justify-center gap-x-2", className)}>
      <strong>{term.primary}</strong>
      <span aria-hidden="true" className="text-border">·</span>
      <span className="font-medium text-muted-foreground">{term.secondary}</span>
    </span>
  )
}
