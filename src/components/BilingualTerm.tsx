import type { BilingualTerm as Term } from "@/language/bilingualTerms"
import { cn } from "@/lib/utils"

export function BilingualTerm({ term, className }: { term: Term; className?: string }) {
  return (
    <span className={cn("bilingual-term inline-flex flex-col items-center justify-center align-middle", className)}>
      <strong className="bilingual-primary">{term.primary}</strong>
      <span className="bilingual-secondary text-muted-foreground">{term.secondary}</span>
    </span>
  )
}
