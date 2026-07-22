import { beforeEach, describe, expect, it } from "vitest"
import { clearData, GUEST_SCOPE, LEGACY_STORAGE_KEY, loadData, mergeLearningData, saveData, storageKey } from "@/storage/progressStorage"
import type { StoredGameData } from "@/types/game"

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

function gameData(updatedAt = "2026-07-20T00:00:00.000Z"): StoredGameData {
  return {
    schemaVersion: 2,
    appVersion: "0.1.0",
    settings: { languagePriority: "english-first", showEnglish: true, showMaori: true, questionPresentation: "numbers", sessionLength: 10, updatedAt },
    sessions: [],
    attempts: [],
    activeSession: null,
  }
}

describe("progress storage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true })
  })

  it("migrates the old unscoped guest record without losing progress", () => {
    const legacy = {
      ...gameData(),
      schemaVersion: 1,
      attempts: [{
        id: "a1", timestamp: "2026-07-20T00:00:00.000Z", sessionId: "s1", level: 1, skill: "bond-complete",
        itemKey: "bond-complete:6:4", animal: "turtle", operands: [6, 4], expectedAnswer: 10, submittedAnswers: [10],
        correctOnFirstAttempt: true, hintsUsed: 0, responseMs: 450_000,
      }],
    }
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy))

    const loaded = loadData(GUEST_SCOPE)

    expect(loaded.schemaVersion).toBe(2)
    expect(loaded.attempts).toHaveLength(1)
    expect(loaded.attempts[0].activeDurationMs).toBe(300_000)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(storageKey(GUEST_SCOPE))).not.toBeNull()
  })

  it("repairs legacy sessions that predate configurable session lengths", () => {
    const legacy = {
      ...gameData(),
      schemaVersion: 1,
      sessions: [{
        id: "legacy-session",
        level: 2,
        startedAt: "2026-07-19T00:00:00.000Z",
        endedAt: "2026-07-19T00:05:00.000Z",
        status: "complete",
        questionsCompleted: 10,
      }],
    }
    localStorage.setItem(storageKey(GUEST_SCOPE), JSON.stringify(legacy))

    const loaded = loadData(GUEST_SCOPE)

    expect(loaded.sessions[0].totalQuestions).toBe(10)
  })

  it("keeps guest and account caches isolated", () => {
    const guest = gameData()
    const account = { ...gameData(), settings: { ...gameData().settings, sessionLength: 30 as const } }
    saveData(guest, GUEST_SCOPE)
    saveData(account, "user:abc")
    clearData(GUEST_SCOPE)

    expect(localStorage.getItem(storageKey(GUEST_SCOPE))).toBeNull()
    expect(loadData("user:abc").settings.sessionLength).toBe(30)
  })

  it("merges evidence by client UUID and applies last-write-wins settings", () => {
    const local = gameData("2026-07-20T00:00:00.000Z")
    const remote = gameData("2026-07-21T00:00:00.000Z")
    local.attempts.push({
      id: "same", timestamp: "2026-07-20T00:00:00.000Z", sessionId: "s1", level: 1, skill: "bond-complete", itemKey: "x",
      animal: "turtle", operands: [6, 4], expectedAnswer: 10, submittedAnswers: [10], correctOnFirstAttempt: true, hintsUsed: 0, activeDurationMs: 1000, responseMs: 1000,
    })
    remote.attempts.push(local.attempts[0], { ...local.attempts[0], id: "remote", timestamp: "2026-07-21T00:00:00.000Z" })
    remote.settings.sessionLength = 20

    const merged = mergeLearningData(local, remote)

    expect(merged.attempts.map((attempt) => attempt.id)).toEqual(["same", "remote"])
    expect(merged.settings.sessionLength).toBe(20)
  })
})
