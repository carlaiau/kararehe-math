import { getAnimal } from "@/data/animals"
import type { AnimalType } from "@/types/game"
import { cn } from "@/lib/utils"

interface TenFrameProps {
  animal: AnimalType
  filled: number
  added?: number
  emptyVisible?: boolean
  label: string
}

export function TenFrame({ animal, filled, added = 0, emptyVisible = true, label }: TenFrameProps) {
  const emoji = getAnimal(animal).emoji
  return (
    <div className="ten-frame" role="img" aria-label={label}>
      {Array.from({ length: 10 }, (_, index) => {
        const isFilled = index < filled
        const isAdded = index >= filled && index < filled + added
        return (
          <div key={index} className={cn("ten-cell", isAdded && "ten-cell-added", !isFilled && !isAdded && !emptyVisible && "ten-cell-soft")}>
            {(isFilled || isAdded) && <span aria-hidden="true">{emoji}</span>}
          </div>
        )
      })}
    </div>
  )
}
