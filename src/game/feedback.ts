import { animalTerm } from "@/language/bilingualTerms"
import type { AnimalType, LanguagePriority } from "@/types/game"

export function countFeedback(animal: AnimalType, quantity: number, priority: LanguagePriority) {
  const noun = animalTerm(animal, quantity, priority).primary
  const verb = quantity === 1 ? "is" : "are"

  return `There ${verb} ${quantity} ${noun}.`
}
