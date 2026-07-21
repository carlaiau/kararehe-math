import { createContext, useContext, type ReactNode } from "react"
import type { BilingualTerm as Term } from "@/language/bilingualTerms"
import { cn } from "@/lib/utils"

interface LanguageDisplaySettings {
  showEnglish: boolean
  showMaori: boolean
}

const LanguageDisplayContext = createContext<LanguageDisplaySettings>({ showEnglish: true, showMaori: true })

export function LanguageDisplayProvider({ settings, children }: { settings: LanguageDisplaySettings; children: ReactNode }) {
  return <LanguageDisplayContext.Provider value={settings}>{children}</LanguageDisplayContext.Provider>
}

export function BilingualTerm({ term, className }: { term: Term; className?: string }) {
  const { showEnglish, showMaori } = useContext(LanguageDisplayContext)
  const visibleTerms = [
    showEnglish ? term.english : null,
    showMaori ? term.maori : null,
  ].filter((value): value is string => value !== null)

  if (visibleTerms.length === 0) return null

  return (
    <span className={cn("bilingual-term inline-flex flex-col items-center justify-center align-middle", visibleTerms.length > 1 && "bilingual-multiple", className)}>
      {visibleTerms.map((value, index) => index === 0
        ? <strong className="bilingual-primary" key={value}>{value}</strong>
        : <span className="bilingual-secondary text-muted-foreground" key={value}>{value}</span>)}
    </span>
  )
}
