import { describe, expect, it } from "vitest"
import { generateQuestion } from "@/game/questionGenerator"
import type { LevelId, SessionLength } from "@/types/game"

function session(level: LevelId, length: SessionLength) {
  return Array.from({ length }, (_, index) => generateQuestion(level, [], [], index + 1, length, []))
}

describe("Number Sense question generation", () => {
  it("keeps counting quantities small and includes the answer in ordered choices", () => {
    const questions = session("count-objects", 8)
    expect(questions.some((question) => question.skill === "touch-count")).toBe(true)
    for (const question of questions) {
      expect(question.first).toBeGreaterThanOrEqual(1)
      expect(question.first).toBeLessThanOrEqual(5)
      expect(question.answerChoices.map((choice) => choice.value)).toContain(question.expectedAnswer)
      expect(question.answerChoices.map((choice) => choice.value)).toEqual(
        [...question.answerChoices.map((choice) => choice.value)].sort((a, b) => a - b),
      )
    }
  })

  it("uses deliberate 1–4 patterns and includes a no-pressure covered question", () => {
    const questions = session("subitise-small-groups", 8)
    expect(questions.some((question) => question.skill === "subitise-peek" && question.displayMs)).toBe(true)
    for (const question of questions) {
      expect(question.first).toBeGreaterThanOrEqual(1)
      expect(question.first).toBeLessThanOrEqual(4)
      expect(question.patternId).toBeTruthy()
    }
  })

  it("balances more, fewer, and same while keeping comparisons mathematically valid", () => {
    const questions = session("compare-quantities", 8)
    const counts = new Map<string, number>()
    for (const question of questions) {
      counts.set(question.relation ?? "", (counts.get(question.relation ?? "") ?? 0) + 1)
      const left = question.leftQuantity ?? 0
      const right = question.rightQuantity ?? 0
      if (question.relation === "same") {
        expect(left).toBe(right)
        expect(question.expectedAnswer).toBe(1)
      } else if (question.relation === "more") {
        expect(question.expectedAnswer).toBe(Math.max(left, right))
      } else {
        expect(question.expectedAnswer).toBe(Math.min(left, right))
      }
    }
    expect(counts.get("more")).toBeGreaterThanOrEqual(2)
    expect(counts.get("fewer")).toBeGreaterThanOrEqual(2)
    expect(counts.get("same")).toBeGreaterThanOrEqual(2)
  })

  it("preserves the three existing addition generators under stable IDs", () => {
    expect(generateQuestion("make-10", [], [], 1, 10, []).level).toBe("make-10")
    expect(generateQuestion("teen-numbers", [], [], 1, 10, []).level).toBe("teen-numbers")
    expect(generateQuestion("bridge-through-10", [], [], 1, 10, []).level).toBe("bridge-through-10")
  })
})
