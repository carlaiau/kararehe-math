import type { AnimalType } from "@/types/game"

export interface AnimalDefinition {
  id: AnimalType
  emoji: string
  en: { singular: string; plural: string }
  mi: { singular: string; plural: string }
}

export const animals: AnimalDefinition[] = [
  { id: "turtle", emoji: "🐢", en: { singular: "turtle", plural: "turtles" }, mi: { singular: "honu", plural: "honu" } },
  { id: "whale", emoji: "🐋", en: { singular: "whale", plural: "whales" }, mi: { singular: "tohorā", plural: "tohorā" } },
  { id: "tiger", emoji: "🐯", en: { singular: "tiger", plural: "tigers" }, mi: { singular: "taika", plural: "taika" } },
  { id: "cat", emoji: "🐱", en: { singular: "cat", plural: "cats" }, mi: { singular: "ngeru", plural: "ngeru" } },
  { id: "dog", emoji: "🐶", en: { singular: "dog", plural: "dogs" }, mi: { singular: "kurī", plural: "kurī" } },
  { id: "penguin", emoji: "🐧", en: { singular: "penguin", plural: "penguins" }, mi: { singular: "kororā", plural: "kororā" } },
]

export function getAnimal(id: AnimalType) {
  return animals.find((animal) => animal.id === id) ?? animals[0]
}
