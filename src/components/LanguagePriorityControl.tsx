import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LanguagePriority } from "@/types/game"

export function LanguagePriorityControl({ value, onChange }: { value: LanguagePriority; onChange: (value: LanguagePriority) => void }) {
  const maoriFirst = value === "maori-first"
  return (
    <Button
      variant="ghost"
      size="default"
      onClick={() => onChange(maoriFirst ? "english-first" : "maori-first")}
      aria-label={`Make ${maoriFirst ? "English" : "te reo Māori"} the primary learning language`}
    >
      <Languages className="size-5" />
      <span>{maoriFirst ? "Te reo first" : "English first"}</span>
    </Button>
  )
}
