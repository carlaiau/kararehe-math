import { animals } from "@/data/animals"
import type {
  AnimalType,
  GameQuestion,
  LevelId,
  QuestionAttempt,
  QuestionSkill,
  SessionLength,
} from "@/types/game"

const randomId = () => crypto.randomUUID()

function answerChoices(answer: number, min: number, max: number) {
  const rangeSize = max - min + 1
  const start = rangeSize <= 9
    ? min
    : Math.min(Math.max(answer - 4, min), max - 8)
  const values = Array.from({ length: 9 }, (_, index) => start + index)
  return values.map((value) => ({
    value,
    label: String(value),
  }))
}

function smallAnswerChoices(answer: number, min = 1, max = 5) {
  const values = new Set([answer])
  for (let distance = 1; values.size < Math.min(3, max - min + 1); distance += 1) {
    if (answer - distance >= min) values.add(answer - distance)
    if (answer + distance <= max) values.add(answer + distance)
  }
  return [...values].sort((a, b) => a - b).map((value) => ({ value, label: String(value) }))
}

export function answerChoicesForQuestion(question: GameQuestion) {
  if (question.level === "count-objects") return smallAnswerChoices(question.expectedAnswer)
  if (question.level === "subitise-small-groups") return smallAnswerChoices(question.expectedAnswer, 1, 4)
  if (question.level === "compare-quantities") return question.skill === "compare-same"
    ? [{ value: 1, label: "Same" }, { value: 0, label: "Different" }]
    : []
  if (question.skill === "bond-complete") return answerChoices(question.expectedAnswer, 6, 14)
  if (
    question.skill === "bond-missing-second"
    || question.skill === "teen-missing-ones"
    || question.skill === "bridge-missing-addend"
  ) {
    return answerChoices(question.expectedAnswer, 1, 9)
  }
  return answerChoices(question.expectedAnswer, 11, 19)
}

const bridgePairs = [
  [8, 3], [8, 4], [8, 5], [7, 4], [7, 5], [7, 6], [6, 5],
  [6, 6], [6, 7], [9, 2], [9, 3], [9, 4], [9, 5],
] as const

function chooseAnimal(recent: AnimalType[]) {
  const lastTwo = recent.slice(-2)
  const blocked = lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null
  const available = blocked ? animals.filter((animal) => animal.id !== blocked) : animals
  return available[Math.floor(Math.random() * available.length)].id
}

export function itemKey(skill: QuestionSkill, first: number, second: number) {
  return `${skill}:${first}:${second}`
}

function firstAttemptSuccess(attempts: QuestionAttempt[], key: string) {
  return attempts.some((attempt) => attempt.itemKey === key && attempt.correctOnFirstAttempt)
}

function attemptsFor(attempts: QuestionAttempt[], key: string) {
  return attempts.filter((attempt) => attempt.itemKey === key)
}

function isSecure(attempts: QuestionAttempt[], key: string) {
  const itemAttempts = attemptsFor(attempts, key)
  return itemAttempts.length >= 5 && itemAttempts.slice(-5).filter((attempt) => attempt.correctOnFirstAttempt).length >= 4
}

function chooseCandidate<T extends { key: string; boost?: number }>(
  candidates: T[],
  attempts: QuestionAttempt[],
  mode: "targeted" | "review" | "confidence",
  recentItemKeys: string[],
) {
  const lastTwo = recentItemKeys.slice(-2)
  const blockedKey = lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null
  const eligible = blockedKey ? candidates.filter((candidate) => candidate.key !== blockedKey) : candidates
  const pool = eligible.length > 0 ? eligible : candidates
  const scored = pool.map((candidate) => {
    const history = attemptsFor(attempts, candidate.key)
    const latest = history.at(-1)
    let score = 1
    if (mode === "targeted") {
      if (history.length === 0) score = 5
      else if (latest && !latest.correctOnFirstAttempt) score = 6
      else if (!isSecure(attempts, candidate.key)) score = 3
    } else if (mode === "review") {
      score = isSecure(attempts, candidate.key) ? 5 : history.length > 0 ? 2 : 0
    } else {
      score = latest?.correctOnFirstAttempt ? 6 : history.length === 0 ? 2 : 0
    }
    return { candidate, score: score + (candidate.boost ?? 0) + Math.random() }
  })
  return scored.sort((a, b) => b.score - a.score)[0].candidate
}

function sessionMode(questionNumber: number, totalQuestions: SessionLength): "targeted" | "review" | "confidence" {
  if (questionNumber === totalQuestions) return "confidence"
  const progress = questionNumber / totalQuestions
  if (progress >= 0.75 && questionNumber < totalQuestions) return "review"
  return "targeted"
}

function progressionBand(questionNumber: number, totalQuestions: SessionLength) {
  if (questionNumber <= Math.max(1, Math.round(totalQuestions * 0.25))) return "warmup" as const
  if (questionNumber === totalQuestions) return "confidence" as const
  if (questionNumber === Math.max(2, totalQuestions - 2)) return "challenge" as const
  if (questionNumber === totalQuestions - 1) return "review" as const
  return "core" as const
}

function quantityForPosition(questionNumber: number, totalQuestions: SessionLength, max = 5) {
  const band = progressionBand(questionNumber, totalQuestions)
  if (band === "warmup") return 1 + ((questionNumber - 1) % Math.min(3, max))
  if (band === "confidence") return 2 + ((questionNumber + totalQuestions) % Math.max(1, max - 1))
  if (band === "challenge") return max
  return 1 + ((questionNumber * 3 + totalQuestions) % max)
}

function countQuestion(animal: AnimalType, questionNumber: number, totalQuestions: SessionLength): GameQuestion {
  const quantity = quantityForPosition(questionNumber, totalQuestions)
  const band = progressionBand(questionNumber, totalQuestions)
  const touch = band === "core" || band === "challenge"
  const layout = band === "warmup" || questionNumber % 3 === 0 ? "structured" : "scattered"
  const skill: QuestionSkill = touch ? "touch-count" : "count-choose"
  return {
    id: randomId(), level: "count-objects", skill, animal,
    prompt: touch ? "Touch each one, then choose how many." : "How many are there?",
    equation: "",
    first: quantity, second: 0, expectedAnswer: quantity,
    answerChoices: smallAnswerChoices(quantity),
    visualMode: "count-group", layout, requiresTouchCount: touch,
  }
}

function subitiseQuestion(animal: AnimalType, questionNumber: number, totalQuestions: SessionLength): GameQuestion {
  const quantity = quantityForPosition(questionNumber, totalQuestions, 4)
  const band = progressionBand(questionNumber, totalQuestions)
  const skill: QuestionSkill = band === "challenge" || questionNumber % 5 === 0
    ? "subitise-peek"
    : questionNumber % 4 === 0 ? "subitise-match" : "subitise-persistent"
  const patternId = quantity === 1 ? "single" : quantity === 2 ? "pair" : quantity === 3 ? "triangle" : questionNumber % 2 === 0 ? "square" : "two-pairs"
  return {
    id: randomId(), level: "subitise-small-groups", skill, animal,
    prompt: skill === "subitise-match" ? "Which group has the same number?" : "How many did you see?",
    equation: "",
    first: quantity, second: 0, expectedAnswer: quantity,
    answerChoices: smallAnswerChoices(quantity, 1, 4),
    visualMode: "subitise", layout: "structured", patternId,
    displayMs: skill === "subitise-peek" ? 1400 : undefined,
  }
}

function compareQuestion(animal: AnimalType, questionNumber: number, totalQuestions: SessionLength): GameQuestion {
  const relationCycle = ["more", "fewer", "same"] as const
  const relation = relationCycle[(questionNumber - 1) % relationCycle.length]
  const left = quantityForPosition(questionNumber, totalQuestions)
  let right = relation === "same" ? left : 1 + ((left + questionNumber + 1) % 5)
  if (right === left && relation !== "same") right = left === 5 ? 4 : left + 1
  const skill: QuestionSkill = relation === "more" ? "compare-more" : relation === "fewer" ? "compare-fewer" : "compare-same"
  const expectedAnswer = relation === "same" ? 1 : relation === "more" ? Math.max(left, right) : Math.min(left, right)
  return {
    id: randomId(), level: "compare-quantities", skill, animal,
    prompt: relation === "more" ? "Which group has more?" : relation === "fewer" ? "Which group has fewer?" : "Are these groups the same?",
    equation: "", first: left, second: right, expectedAnswer,
    answerChoices: relation === "same" ? [{ value: 1, label: "Same" }, { value: 0, label: "Different" }] : [],
    visualMode: "compare-groups",
    layout: questionNumber % 2 === 0 ? "different-spacing" : "aligned",
    leftQuantity: left, rightQuantity: right, relation,
  }
}

function levelOneQuestion(attempts: QuestionAttempt[], animal: AnimalType, questionNumber: number, totalQuestions: SessionLength, recentItemKeys: string[]): GameQuestion {
  const candidates: Array<{ key: string; first: number; second: number; skill: QuestionSkill }> = []
  for (let first = 1; first <= 9; first += 1) {
    const second = 10 - first
    const completeKey = itemKey("bond-complete", first, second)
    candidates.push({ key: completeKey, first, second, skill: "bond-complete" })
    if (firstAttemptSuccess(attempts, completeKey)) {
      candidates.push({ key: itemKey("bond-missing-second", first, second), first, second, skill: "bond-missing-second" })
    }
  }
  const selected = chooseCandidate(candidates, attempts, sessionMode(questionNumber, totalQuestions), recentItemKeys)
  const missing = selected.skill === "bond-missing-second"
  return {
    id: randomId(), level: "make-10", skill: selected.skill, animal,
    prompt: missing ? "How many more make 10?" : "How many are there altogether?",
    equation: missing ? `${selected.first} + ? = 10` : `${selected.first} + ${selected.second} = ?`,
    first: selected.first, second: selected.second,
    expectedAnswer: missing ? selected.second : 10,
    answerChoices: missing
      ? answerChoices(selected.second, 1, 9)
      : answerChoices(10, 6, 14),
    visualMode: "ten-frame",
  }
}

function levelTwoQuestion(attempts: QuestionAttempt[], animal: AnimalType, questionNumber: number, totalQuestions: SessionLength, recentItemKeys: string[]): GameQuestion {
  const candidates: Array<{ key: string; teen: number; ones: number; skill: QuestionSkill; boost?: number }> = []
  const preferMissingForm = questionNumber % 2 === 0
  for (let teen = 11; teen <= 19; teen += 1) {
    const ones = teen - 10
    const countKey = itemKey("teen-count-total", 10, ones)
    candidates.push({ key: countKey, teen, ones, skill: "teen-count-total", boost: preferMissingForm ? 0 : 1.5 })
    candidates.push({ key: itemKey("teen-missing-ones", 10, ones), teen, ones, skill: "teen-missing-ones", boost: preferMissingForm ? 1.5 : 0 })
    if (firstAttemptSuccess(attempts, countKey)) {
      candidates.push({ key: itemKey("teen-add-ten", 10, ones), teen, ones, skill: "teen-add-ten" })
      candidates.push({ key: itemKey("teen-identify-number", 10, ones), teen, ones, skill: "teen-identify-number" })
    }
  }
  const selected = chooseCandidate(candidates, attempts, sessionMode(questionNumber, totalQuestions), recentItemKeys)
  const missing = selected.skill === "teen-missing-ones"
  const count = selected.skill === "teen-count-total"
  return {
    id: randomId(), level: "teen-numbers", skill: selected.skill, animal,
    prompt: missing ? `${selected.teen} is 10 and how many more?` : count ? "How many are there altogether?" : "Which number is this?",
    equation: missing ? `10 + ? = ${selected.teen}` : `10 + ${selected.ones} = ?`,
    first: 10, second: selected.ones,
    expectedAnswer: missing ? selected.ones : selected.teen,
    answerChoices: missing
      ? answerChoices(selected.ones, 1, 9)
      : answerChoices(selected.teen, 11, 19),
    visualMode: "full-ten-plus-ones",
  }
}

function levelThreeQuestion(attempts: QuestionAttempt[], animal: AnimalType, questionNumber: number, totalQuestions: SessionLength, recentItemKeys: string[]): GameQuestion {
  const candidates: Array<{ key: string; first: number; second: number; skill: QuestionSkill; boost?: number }> = []

  for (const [first, second] of bridgePairs) {
    const makeKey = itemKey("bridge-make-ten", first, second)
    candidates.push({ key: makeKey, first, second, skill: "bridge-make-ten" })

    const makeTenKnown = firstAttemptSuccess(attempts, makeKey)
    if (makeTenKnown) {
      const splitKey = itemKey("bridge-split", first, second)
      const splitKnown = firstAttemptSuccess(attempts, splitKey)
      candidates.push({ key: splitKey, first, second, skill: "bridge-split", boost: splitKnown ? 0.5 : 2 })
      if (splitKnown) {
        const totalKey = itemKey("bridge-total", first, second)
        candidates.push({
          key: totalKey,
          first,
          second,
          skill: "bridge-total",
          boost: firstAttemptSuccess(attempts, totalKey) ? 0.5 : 2.5,
        })
      }
    }

  }

  const selected = chooseCandidate(candidates, attempts, sessionMode(questionNumber, totalQuestions), recentItemKeys)
  const total = selected.first + selected.second
  const isMakeTen = selected.skill === "bridge-make-ten"
  const isSplit = selected.skill === "bridge-split"

  return {
    id: randomId(), level: "bridge-through-10", skill: selected.skill, animal,
    prompt: isMakeTen
      ? "Move animals to fill the ten-frame."
      : isSplit
        ? `${selected.first} needs how many more to make 10?`
        : "Make 10, then add to find the total.",
    equation: isMakeTen
      ? `${selected.first} + ${selected.second}`
      : isSplit
        ? `${selected.first} + ? = 10`
        : `${selected.first} + ${selected.second} = ?`,
    first: selected.first,
    second: selected.second,
    expectedAnswer: total,
    answerChoices: answerChoices(total, 11, 19),
    visualMode: isMakeTen || isSplit ? "bridge" : "equation-only",
  }
}

export function generateQuestion(
  level: LevelId,
  attempts: QuestionAttempt[],
  recentAnimals: AnimalType[],
  questionNumber: number,
  totalQuestions: SessionLength,
  recentItemKeys: string[],
) {
  const animal = chooseAnimal(recentAnimals)
  if (level === "count-objects") return countQuestion(animal, questionNumber, totalQuestions)
  if (level === "subitise-small-groups") return subitiseQuestion(animal, questionNumber, totalQuestions)
  if (level === "compare-quantities") return compareQuestion(animal, questionNumber, totalQuestions)
  if (level === "make-10") return levelOneQuestion(attempts, animal, questionNumber, totalQuestions, recentItemKeys)
  if (level === "teen-numbers") return levelTwoQuestion(attempts, animal, questionNumber, totalQuestions, recentItemKeys)
  return levelThreeQuestion(attempts, animal, questionNumber, totalQuestions, recentItemKeys)
}
