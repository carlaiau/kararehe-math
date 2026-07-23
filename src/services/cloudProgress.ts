import { neon } from "@/services/neon"
import { initialData, mergeLearningData, normalizeAdditionSessionLength, normalizeNumberSenseSessionLength, normalizeSessionLength } from "@/storage/progressStorage"
import { isNumberSenseLevel, legacyLevelId, type AuthUser, type GameSession, type LearnerProfile, type LevelId, type QuestionAttempt, type StoredGameData } from "@/types/game"

function requireNeon() {
  if (!neon) throw new Error("Neon is not configured.")
  return neon
}

function unwrap<T>(result: { data: T | null; error: { message?: string } | null }, fallback: string): T {
  if (result.error) throw new Error(result.error.message || fallback)
  if (result.data === null) throw new Error(fallback)
  return result.data
}

function mapProfile(row: Record<string, unknown>): LearnerProfile {
  return {
    id: String(row.id),
    authUserId: String(row.auth_user_id),
    displayName: String(row.display_name),
    birthMonth: row.birth_month === null ? null : Number(row.birth_month),
    birthYear: row.birth_year === null ? null : Number(row.birth_year),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function ensureLearnerProfile(user: AuthUser, pending?: { birthMonth: number | null; birthYear: number | null }) {
  const client = requireNeon()
  const existing = await client
    .from("learner_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) return mapProfile(existing.data as Record<string, unknown>)
  const result = await client.from("learner_profiles").insert({
    auth_user_id: user.id,
    display_name: user.name,
    birth_month: pending?.birthMonth ?? null,
    birth_year: pending?.birthYear ?? null,
  }).select("*").single()
  return mapProfile(unwrap(result, "Could not create the learner profile.") as Record<string, unknown>)
}

export async function updateLearnerProfile(profile: LearnerProfile, values: Pick<LearnerProfile, "displayName" | "birthMonth" | "birthYear">) {
  const client = requireNeon()
  const result = await client
    .from("learner_profiles")
    .update({
      display_name: values.displayName,
      birth_month: values.birthMonth,
      birth_year: values.birthYear,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("*")
    .single()
  return mapProfile(unwrap(result, "Could not update the learner profile.") as Record<string, unknown>)
}

function sessionRow(profileId: string, session: GameSession) {
  const inferredLength = session.questionsCompleted > 20 ? 30 : session.questionsCompleted > 10 ? 20 : 10
  return {
    id: session.id,
    learner_profile_id: profileId,
    level_id: session.level,
    level: legacyLevelNumber(session.level),
    started_at: session.startedAt,
    ended_at: session.endedAt,
    status: session.status,
    questions_completed: session.questionsCompleted,
    total_questions: normalizeSessionLength(session.totalQuestions, inferredLength),
    app_version: "0.1.0",
    schema_version: 3,
    updated_at: new Date().toISOString(),
  }
}

function attemptRow(profileId: string, attempt: QuestionAttempt) {
  return {
    id: attempt.id,
    learner_profile_id: profileId,
    session_id: attempt.sessionId,
    occurred_at: attempt.timestamp,
    level_id: attempt.level,
    level: legacyLevelNumber(attempt.level),
    skill: attempt.skill,
    item_key: attempt.itemKey,
    animal: attempt.animal,
    operands: attempt.operands,
    expected_answer: attempt.expectedAnswer,
    submitted_answers: attempt.submittedAnswers ?? [],
    partition_submitted_answers: attempt.partitionSubmittedAnswers ?? [],
    partition_correct_first_try: attempt.partitionCorrectOnFirstAttempt ?? null,
    sum_correct_first_try: attempt.sumCorrectOnFirstAttempt ?? null,
    correct_first_try: attempt.correctOnFirstAttempt,
    hints_used: attempt.hintsUsed ?? 0,
    active_duration_ms: Math.min(300_000, attempt.activeDurationMs ?? attempt.responseMs),
    legacy_response_ms: Math.max(0, attempt.responseMs ?? 0),
    payload: attempt,
    app_version: "0.1.0",
    schema_version: 3,
  }
}

function legacyLevelNumber(level: LevelId) {
  if (level === "make-10") return 1
  if (level === "teen-numbers") return 2
  if (level === "bridge-through-10") return 3
  return null
}

export async function syncCloudProgress(profileId: string, data: StoredGameData) {
  const client = requireNeon()
  const settingsRow = {
    learner_profile_id: profileId,
    show_english: data.settings.showEnglish,
    show_maori: data.settings.showMaori,
    question_presentation: data.settings.questionPresentation,
    session_length: data.settings.sessionLength,
    number_sense_session_length: data.settings.numberSenseSessionLength,
    updated_at: data.settings.updatedAt,
  }
  const currentSettings = await client.from("learner_settings").select("updated_at").eq("learner_profile_id", profileId).maybeSingle()
  if (currentSettings.error) throw new Error(currentSettings.error.message)
  const settingsResult = currentSettings.data
    ? Date.parse(data.settings.updatedAt) > Date.parse(currentSettings.data.updated_at)
      ? await client.from("learner_settings").update(settingsRow).eq("learner_profile_id", profileId).lt("updated_at", data.settings.updatedAt)
      : null
    : await client.from("learner_settings").insert(settingsRow)
  if (settingsResult?.error) throw new Error(settingsResult.error.message)

  const sessionRowsById = new Map<string, Record<string, unknown>>(data.sessions.map((session) => [session.id, sessionRow(profileId, session)]))
  const orphanAttempts = new Map<string, QuestionAttempt[]>()
  data.attempts.forEach((attempt) => {
    if (sessionRowsById.has(attempt.sessionId) || data.activeSession?.id === attempt.sessionId) return
    orphanAttempts.set(attempt.sessionId, [...(orphanAttempts.get(attempt.sessionId) ?? []), attempt])
  })
  orphanAttempts.forEach((attempts, sessionId) => {
    const ordered = [...attempts].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    sessionRowsById.set(sessionId, {
      id: sessionId,
      learner_profile_id: profileId,
      level_id: ordered[0].level,
      level: legacyLevelNumber(ordered[0].level),
      started_at: ordered[0].timestamp,
      ended_at: ordered.at(-1)?.timestamp ?? ordered[0].timestamp,
      status: "incomplete",
      questions_completed: ordered.length,
      total_questions: isNumberSenseLevel(ordered[0].level) ? data.settings.numberSenseSessionLength : data.settings.sessionLength,
      app_version: "0.1.0",
      schema_version: 3,
      updated_at: new Date().toISOString(),
    })
  })
  const sessionRows = [...sessionRowsById.values()]
  if (data.activeSession) sessionRows.push({
    id: data.activeSession.id,
    learner_profile_id: profileId,
    level_id: data.activeSession.level,
    level: legacyLevelNumber(data.activeSession.level),
    started_at: data.activeSession.startedAt,
    ended_at: null,
    status: "in_progress",
    questions_completed: data.activeSession.questionsCompleted,
    total_questions: normalizeSessionLength(data.activeSession.totalQuestions, isNumberSenseLevel(data.activeSession.level) ? data.settings.numberSenseSessionLength : data.settings.sessionLength),
    app_version: "0.1.0",
    schema_version: 3,
    updated_at: new Date().toISOString(),
  })
  if (sessionRows.length > 0) {
    const result = await client.from("learning_sessions").upsert(sessionRows, { onConflict: "id" })
    if (result.error) throw new Error(result.error.message)
  }
  if (data.attempts.length > 0) {
    const result = await client.from("question_attempts").upsert(data.attempts.map((attempt) => attemptRow(profileId, attempt)), { onConflict: "id", ignoreDuplicates: true })
    if (result.error) throw new Error(result.error.message)
  }
}

export async function loadCloudProgress(profileId: string, local: StoredGameData) {
  const client = requireNeon()
  const [settingsResult, sessionsResult, attemptsResult] = await Promise.all([
    client.from("learner_settings").select("*").eq("learner_profile_id", profileId).maybeSingle(),
    client.from("learning_sessions").select("*").eq("learner_profile_id", profileId).in("status", ["complete", "incomplete"]),
    client.from("question_attempts").select("payload").eq("learner_profile_id", profileId).order("occurred_at"),
  ])
  if (settingsResult.error) throw new Error(settingsResult.error.message)
  if (sessionsResult.error) throw new Error(sessionsResult.error.message)
  if (attemptsResult.error) throw new Error(attemptsResult.error.message)

  const remote: StoredGameData = {
    ...initialData,
    settings: settingsResult.data ? {
      languagePriority: "english-first",
      showEnglish: Boolean(settingsResult.data.show_english),
      showMaori: Boolean(settingsResult.data.show_maori),
      questionPresentation: settingsResult.data.question_presentation,
      sessionLength: normalizeAdditionSessionLength(settingsResult.data.session_length),
      numberSenseSessionLength: normalizeNumberSenseSessionLength(settingsResult.data.number_sense_session_length),
      updatedAt: settingsResult.data.updated_at,
    } : initialData.settings,
    sessions: (sessionsResult.data ?? []).map((row) => ({
      id: row.id,
      level: legacyLevelId(row.level_id ?? row.level) ?? "make-10",
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      questionsCompleted: row.questions_completed,
      totalQuestions: row.total_questions,
    })),
    attempts: (attemptsResult.data ?? []).map((row) => {
      const payload = row.payload as QuestionAttempt
      return { ...payload, level: legacyLevelId(payload.level) ?? "make-10" }
    }),
  }
  return mergeLearningData(local, remote)
}
