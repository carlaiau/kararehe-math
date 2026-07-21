import { getAnimal } from "@/data/animals"
import { numberWordsEn, numberWordsMi } from "@/data/numberWords"
import type { AnimalType, LanguagePriority } from "@/types/game"

export interface BilingualTerm {
  primary: string
  secondary: string
}

function order(en: string, mi: string, priority: LanguagePriority): BilingualTerm {
  return priority === "maori-first"
    ? { primary: mi, secondary: en }
    : { primary: en, secondary: mi }
}

export function animalTerm(id: AnimalType, quantity: number, priority: LanguagePriority) {
  const animal = getAnimal(id)
  const form = quantity === 1 ? "singular" : "plural"
  return order(animal.en[form], animal.mi[form], priority)
}

export function numberTerm(value: number, priority: LanguagePriority) {
  return order(numberWordsEn[value] ?? String(value), numberWordsMi[value] ?? String(value), priority)
}
