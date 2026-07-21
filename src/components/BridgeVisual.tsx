import { useEffect, useRef, useState } from "react"
import { TenFrame } from "@/components/TenFrame"
import { getAnimal } from "@/data/animals"
import type { AnimalType } from "@/types/game"

export function BridgeVisual({
  questionId,
  first,
  second,
  animal,
  completed,
  onComplete,
}: {
  questionId: string
  first: number
  second: number
  animal: AnimalType
  completed: boolean
  onComplete: (moved: number) => void
}) {
  const needed = 10 - first
  const [moved, setMoved] = useState(completed ? needed : 0)
  const completedRef = useRef(completed)
  const definition = getAnimal(animal)

  useEffect(() => {
    if (moved === needed && !completedRef.current) {
      completedRef.current = true
      onComplete(needed)
    }
  }, [moved, needed, onComplete])

  const moveOne = () => {
    if (!completed && moved < needed) setMoved((current) => current + 1)
  }

  const remaining = Math.max(0, second - moved)

  return (
    <div className="bridge-mover">
      <div
        className="bridge-drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          moveOne()
        }}
      >
        <p className="bridge-label">Fill the ten-frame</p>
        <TenFrame
          animal={animal}
          filled={first}
          added={moved}
          label={`A ten-frame with ${first + moved} ${definition.en.plural} and ${10 - first - moved} empty spaces.`}
        />
      </div>
      <div className="bridge-arrow" aria-hidden="true">←</div>
      <div className="bridge-extras" aria-label={`${remaining} ${definition.en.plural} left to move or use later`}>
        <p className="bridge-label">Extra animals</p>
        <div className="bridge-extra-animals">
          {Array.from({ length: remaining }, (_, index) => (
            <button
              key={`${questionId}-${index}`}
              type="button"
              className="bridge-animal"
              draggable={!completed && moved < needed}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", "animal")}
              onClick={moveOne}
              aria-label={`Move one ${definition.en.singular} into the ten-frame`}
            >
              {definition.emoji}
            </button>
          ))}
        </div>
        <p className="bridge-instruction">Tap or drag only enough to fill ten.</p>
      </div>
      <p className="sr-only" aria-live="polite">{moved} moved into the frame. {10 - first - moved} spaces left.</p>
    </div>
  )
}
