import type { StoredGameData } from "@/types/game"
import { answerChoicesForQuestion, itemKey } from "@/game/questionGenerator"

export const STORAGE_KEY = "kararehe-math:data"

export const initialData: StoredGameData = {
  schemaVersion: 1,
  appVersion: "0.1.0",
  settings: { languagePriority: "english-first", sessionLength: 10 },
  sessions: [],
  attempts: [],
  activeSession: null,
}

function isStoredGameData(value: unknown): value is StoredGameData {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<StoredGameData>
  return candidate.schemaVersion === 1
    && Array.isArray(candidate.sessions)
    && Array.isArray(candidate.attempts)
    && typeof candidate.settings === "object"
}

export function loadData(): StoredGameData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialData
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredGameData(parsed)) return initialData
    parsed.settings.sessionLength ??= 10
    if (parsed.activeSession) {
      parsed.activeSession.totalQuestions ??= 10
      parsed.activeSession.recentItemKeys ??= [itemKey(
        parsed.activeSession.currentQuestion.skill,
        parsed.activeSession.currentQuestion.first,
        parsed.activeSession.currentQuestion.second,
      )]
      if (parsed.activeSession.level === 3) {
        const question = parsed.activeSession.currentQuestion
        if (question.skill === "bridge-missing-addend") {
          question.skill = "bridge-total"
          question.prompt = "Bridge through 10 to find the total."
          question.equation = `${question.first} + ${question.second} = ?`
          question.visualMode = "equation-only"
          parsed.activeSession.submittedAnswers = []
          parsed.activeSession.selectedAnswer = null
          parsed.activeSession.feedbackState = "answering"
          parsed.activeSession.answeredAt = null
          parsed.activeSession.recentItemKeys = [
            ...parsed.activeSession.recentItemKeys.slice(0, -1),
            itemKey(question.skill, question.first, question.second),
          ]
        }
        question.expectedAnswer = question.first + question.second
        parsed.activeSession.bridgeStage ??= "partition"
        parsed.activeSession.partitionSubmittedAnswers ??= []
      }
      parsed.activeSession.currentQuestion.answerChoices = answerChoicesForQuestion(parsed.activeSession.currentQuestion)
      if (parsed.activeSession.currentQuestion.skill === "teen-missing-ones") {
        const question = parsed.activeSession.currentQuestion
        question.equation = `10 + ? = ${question.first + question.second}`
      }
    }
    return parsed
  } catch {
    return initialData
  }
}

export function saveData(data: StoredGameData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // The game remains usable in memory if browser storage is unavailable.
  }
}

export function exportData(data: StoredGameData) {
  const exported = { ...data, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `kararehe-math-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
