import { animals } from "@/data/animals"
import type {
  AnimalType,
  GameQuestion,
  LevelId,
  QuestionAttempt,
  QuestionSkill,
} from "@/types/game"

const randomId = () => crypto.randomUUID()

function shuffled<T>(values: T[]) {
  return [...values].sort(() => Math.random() - 0.5)
}

function answerChoices(answer: number, min = 0, max = 20) {
  const alternatives = [answer - 1, answer + 1, answer - 2, answer + 2]
    .filter((value) => value >= min && value <= max && value !== answer)
  return shuffled([answer, ...alternatives].slice(0, 3)).map((value) => ({
    value,
    label: String(value),
  }))
}

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

function chooseCandidate<T extends { key: string }>(
  candidates: T[],
  attempts: QuestionAttempt[],
  mode: "targeted" | "review" | "confidence",
) {
  const scored = candidates.map((candidate) => {
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
    return { candidate, score: score + Math.random() }
  })
  return scored.sort((a, b) => b.score - a.score)[0].candidate
}

function sessionMode(questionNumber: number): "targeted" | "review" | "confidence" {
  if (questionNumber === 10) return "confidence"
  if (questionNumber === 4 || questionNumber === 8) return "review"
  return "targeted"
}

function levelOneQuestion(attempts: QuestionAttempt[], animal: AnimalType, questionNumber: number): GameQuestion {
  const candidates: Array<{ key: string; first: number; second: number; skill: QuestionSkill }> = []
  for (let first = 1; first <= 9; first += 1) {
    const second = 10 - first
    const completeKey = itemKey("bond-complete", first, second)
    candidates.push({ key: completeKey, first, second, skill: "bond-complete" })
    if (firstAttemptSuccess(attempts, completeKey)) {
      candidates.push({ key: itemKey("bond-missing-second", first, second), first, second, skill: "bond-missing-second" })
    }
  }
  const selected = chooseCandidate(candidates, attempts, sessionMode(questionNumber))
  const missing = selected.skill === "bond-missing-second"
  return {
    id: randomId(), level: 1, skill: selected.skill, animal,
    prompt: missing ? "How many more make 10?" : "How many are there altogether?",
    equation: missing ? `${selected.first} + ? = 10` : `${selected.first} + ${selected.second} = ?`,
    first: selected.first, second: selected.second,
    expectedAnswer: missing ? selected.second : 10,
    answerChoices: answerChoices(missing ? selected.second : 10, 0, 12),
    visualMode: "ten-frame",
  }
}

function levelTwoQuestion(attempts: QuestionAttempt[], animal: AnimalType, questionNumber: number): GameQuestion {
  const candidates: Array<{ key: string; teen: number; ones: number; skill: QuestionSkill }> = []
  for (let teen = 11; teen <= 19; teen += 1) {
    const ones = teen - 10
    const countKey = itemKey("teen-count-total", 10, ones)
    candidates.push({ key: countKey, teen, ones, skill: "teen-count-total" })
    if (firstAttemptSuccess(attempts, countKey)) {
      candidates.push({ key: itemKey("teen-add-ten", 10, ones), teen, ones, skill: "teen-add-ten" })
      candidates.push({ key: itemKey("teen-identify-number", 10, ones), teen, ones, skill: "teen-identify-number" })
    }
    const forwardUnlocked = firstAttemptSuccess(attempts, itemKey("teen-add-ten", 10, ones))
      || firstAttemptSuccess(attempts, itemKey("teen-identify-number", 10, ones))
    if (forwardUnlocked) {
      candidates.push({ key: itemKey("teen-missing-ones", teen, ones), teen, ones, skill: "teen-missing-ones" })
    }
  }
  const selected = chooseCandidate(candidates, attempts, sessionMode(questionNumber))
  const missing = selected.skill === "teen-missing-ones"
  const count = selected.skill === "teen-count-total"
  return {
    id: randomId(), level: 2, skill: selected.skill, animal,
    prompt: missing ? `${selected.teen} is 10 and how many more?` : count ? "How many are there altogether?" : "Which number is this?",
    equation: missing ? `${selected.teen} = 10 + ?` : `10 + ${selected.ones} = ?`,
    first: 10, second: selected.ones,
    expectedAnswer: missing ? selected.ones : selected.teen,
    answerChoices: answerChoices(missing ? selected.ones : selected.teen, 0, 20),
    visualMode: "full-ten-plus-ones",
  }
}

export function generateQuestion(
  level: LevelId,
  attempts: QuestionAttempt[],
  recentAnimals: AnimalType[],
  questionNumber: number,
) {
  const animal = chooseAnimal(recentAnimals)
  return level === 1
    ? levelOneQuestion(attempts, animal, questionNumber)
    : levelTwoQuestion(attempts, animal, questionNumber)
}
