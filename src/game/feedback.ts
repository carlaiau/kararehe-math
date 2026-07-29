import { animalTerm } from "@/language/bilingualTerms"
import type { AnimalType, LanguagePriority } from "@/types/game"

export function animalName(animal: AnimalType, quantity: number, priority: LanguagePriority) {
  return animalTerm(animal, quantity, priority).primary
}

export function quantityAnimal(
  animal: AnimalType,
  quantity: number,
  priority: LanguagePriority,
  displayedQuantity = String(quantity),
) {
  return `${displayedQuantity} ${animalName(animal, quantity, priority)}`
}

export function animalsRemainingLabel(
  animal: AnimalType,
  quantity: number,
  priority: LanguagePriority,
) {
  const verb = quantity === 1 ? "remains" : "remain"

  return `${quantityAnimal(animal, quantity, priority)} ${verb} after making ten`
}

export function countFeedback(animal: AnimalType, quantity: number, priority: LanguagePriority) {
  const verb = quantity === 1 ? "is" : "are"

  return `There ${verb} ${quantityAnimal(animal, quantity, priority)}.`
}

export function teenNumberRetryFeedback(
  animal: AnimalType,
  extraQuantity: number,
  priority: LanguagePriority,
  displayedTen: string,
  displayedExtra: string,
) {
  return `Here is one group of ${displayedTen} and ${displayedExtra} more ${animalName(animal, extraQuantity, priority)}.`
}

export function bridgeRemainingRetryFeedback(
  animal: AnimalType,
  remainingQuantity: number,
  priority: LanguagePriority,
  displayedTen: string,
  displayedRemaining: string,
) {
  return `You made ${displayedTen}. Now add the ${displayedRemaining} remaining ${animalName(animal, remainingQuantity, priority)}.`
}
