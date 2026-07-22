import type { GameSession, SessionLength, StoredGameData } from "@/types/game"
import { answerChoicesForQuestion, itemKey } from "@/game/questionGenerator"

export const LEGACY_STORAGE_KEY = "kararehe-math:data"
export const GUEST_SCOPE = "guest"
const STORAGE_PREFIX = "kararehe-math:data:"

export const initialData: StoredGameData = {
  schemaVersion: 2,
  appVersion: "0.1.0",
  settings: {
    languagePriority: "english-first",
    showEnglish: true,
    showMaori: true,
    questionPresentation: "numbers",
    sessionLength: 10,
    updatedAt: new Date(0).toISOString(),
  },
  sessions: [],
  attempts: [],
  activeSession: null,
}

function isStoredGameData(value: unknown): value is StoredGameData {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<StoredGameData> & { schemaVersion?: number }
  const schemaVersion = candidate.schemaVersion as number | undefined
  return (schemaVersion === 1 || schemaVersion === 2)
    && Array.isArray(candidate.sessions)
    && Array.isArray(candidate.attempts)
    && typeof candidate.settings === "object"
}

export function storageKey(scope = GUEST_SCOPE) {
  return `${STORAGE_PREFIX}${scope}`
}

export function pendingProfileKey(email: string) {
  return `kararehe-math:pending-profile:${email.trim().toLowerCase()}`
}

export function normalizeSessionLength(value: unknown, fallback: SessionLength = 10): SessionLength {
  return value === 10 || value === 20 || value === 30 ? value : fallback
}

function legacySessionLength(session: GameSession): SessionLength {
  if (session.questionsCompleted > 20) return 30
  if (session.questionsCompleted > 10) return 20
  return 10
}

function migrateData(parsed: StoredGameData): StoredGameData {
  const migrated = parsed as StoredGameData
  migrated.schemaVersion = 2
  migrated.settings.updatedAt ??= new Date(0).toISOString()
  migrated.settings.sessionLength = normalizeSessionLength(migrated.settings.sessionLength)
  migrated.sessions = migrated.sessions.map((session) => ({
    ...session,
    totalQuestions: normalizeSessionLength(session.totalQuestions, legacySessionLength(session)),
  }))
  migrated.attempts = migrated.attempts.map((attempt) => ({
    ...attempt,
    activeDurationMs: Math.min(300_000, Math.max(0, attempt.activeDurationMs ?? attempt.responseMs ?? 0)),
  }))
  return migrated
}

export function loadData(scope = GUEST_SCOPE): StoredGameData {
  try {
    const key = storageKey(scope)
    let raw = localStorage.getItem(key)
    if (!raw && scope === GUEST_SCOPE) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (raw) {
        localStorage.setItem(key, raw)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    }
    if (!raw) return initialData
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredGameData(parsed)) return initialData
    parsed.settings.showEnglish ??= true
    parsed.settings.showMaori ??= true
    parsed.settings.questionPresentation ??= "numbers"
    if (parsed.activeSession) {
      const activeFallback = parsed.activeSession.questionsCompleted > 20 ? 30
        : parsed.activeSession.questionsCompleted > 10 ? 20
          : 10
      parsed.activeSession.totalQuestions = normalizeSessionLength(parsed.activeSession.totalQuestions, activeFallback)
      parsed.activeSession.recentItemKeys ??= [itemKey(
        parsed.activeSession.currentQuestion.skill,
        parsed.activeSession.currentQuestion.first,
        parsed.activeSession.currentQuestion.second,
      )]
      if (parsed.activeSession.level === 3) {
        const question = parsed.activeSession.currentQuestion
        if (question.skill === "bridge-missing-addend") {
          question.skill = "bridge-total"
          question.prompt = "Make 10, then add to find the total."
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
    return migrateData(parsed)
  } catch {
    return initialData
  }
}

export function saveData(data: StoredGameData, scope = GUEST_SCOPE) {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(data))
  } catch {
    // The game remains usable in memory if browser storage is unavailable.
  }
}

export function clearData(scope = GUEST_SCOPE) {
  try {
    localStorage.removeItem(storageKey(scope))
    if (scope === GUEST_SCOPE) localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Nothing to clear when browser storage is unavailable.
  }
}

export function hasLearningData(data: StoredGameData) {
  return data.attempts.length > 0 || data.sessions.length > 0 || data.activeSession !== null
}

export function mergeLearningData(local: StoredGameData, incoming: StoredGameData): StoredGameData {
  const sessions = new Map(local.sessions.map((session) => [session.id, session]))
  incoming.sessions.forEach((session) => sessions.set(session.id, session))
  const attempts = new Map(local.attempts.map((attempt) => [attempt.id, attempt]))
  incoming.attempts.forEach((attempt) => attempts.set(attempt.id, attempt))
  const settings = Date.parse(incoming.settings.updatedAt) > Date.parse(local.settings.updatedAt)
    ? incoming.settings
    : local.settings
  return {
    ...local,
    settings,
    sessions: [...sessions.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    attempts: [...attempts.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  }
}

export function exportData(data: StoredGameData, account?: { profile: unknown; email: string; emailVerified: boolean }) {
  const exported = { ...data, account: account ?? null, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `kararehe-math-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
