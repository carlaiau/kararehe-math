export type NumberSenseLevelId = "count-objects" | "subitise-small-groups" | "compare-quantities"
export type AdditionLevelId = "make-10" | "teen-numbers" | "bridge-through-10"
export type LevelId = NumberSenseLevelId | AdditionLevelId

export const NUMBER_SENSE_LEVELS: NumberSenseLevelId[] = ["count-objects", "subitise-small-groups", "compare-quantities"]
export const ADDITION_LEVELS: AdditionLevelId[] = ["make-10", "teen-numbers", "bridge-through-10"]

export function isNumberSenseLevel(level: LevelId): level is NumberSenseLevelId {
  return NUMBER_SENSE_LEVELS.includes(level as NumberSenseLevelId)
}

export function legacyLevelId(level: unknown): LevelId | null {
  if (level === 1 || level === "1") return "make-10"
  if (level === 2 || level === "2") return "teen-numbers"
  if (level === 3 || level === "3") return "bridge-through-10"
  return [...NUMBER_SENSE_LEVELS, ...ADDITION_LEVELS].includes(level as LevelId) ? level as LevelId : null
}

export type LanguagePriority = "english-first" | "maori-first"
export type QuestionPresentation = "numbers" | "english-words" | "maori-words"
export type NumberSenseSessionLength = 5 | 8 | 10
export type AdditionSessionLength = 10 | 20 | 30
export type SessionLength = NumberSenseSessionLength | AdditionSessionLength

export type AnimalType =
  | "turtle"
  | "whale"
  | "tiger"
  | "cat"
  | "dog"
  | "penguin"

export type QuestionSkill =
  | "count-choose"
  | "touch-count"
  | "subitise-persistent"
  | "subitise-peek"
  | "subitise-match"
  | "compare-more"
  | "compare-fewer"
  | "compare-same"
  | "bond-complete"
  | "bond-missing-second"
  | "teen-count-total"
  | "teen-add-ten"
  | "teen-missing-ones"
  | "teen-identify-number"
  | "bridge-make-ten"
  | "bridge-split"
  | "bridge-total"
  | "bridge-missing-addend"

export interface AnswerChoice {
  value: number
  label: string
}

export interface GameQuestion {
  id: string
  level: LevelId
  skill: QuestionSkill
  animal: AnimalType
  prompt: string
  equation: string
  first: number
  second: number
  expectedAnswer: number
  answerChoices: AnswerChoice[]
  visualMode: "count-group" | "subitise" | "compare-groups" | "ten-frame" | "full-ten-plus-ones" | "bridge" | "equation-only"
  layout?: "structured" | "scattered" | "aligned" | "different-spacing"
  patternId?: string
  displayMs?: number
  leftQuantity?: number
  rightQuantity?: number
  relation?: "more" | "fewer" | "same" | "different"
  requiresTouchCount?: boolean
}

export interface QuestionAttempt {
  id: string
  timestamp: string
  sessionId: string
  level: LevelId
  skill: QuestionSkill
  itemKey: string
  animal: AnimalType
  operands: number[]
  expectedAnswer: number
  submittedAnswers: number[]
  partitionSubmittedAnswers?: number[]
  partitionCorrectOnFirstAttempt?: boolean
  sumCorrectOnFirstAttempt?: boolean
  correctOnFirstAttempt: boolean
  hintsUsed: number
  activeDurationMs: number
  responseMs: number
  layout?: GameQuestion["layout"]
  patternId?: string
  displayMs?: number
  leftQuantity?: number
  rightQuantity?: number
  relation?: GameQuestion["relation"]
  objectsTouched?: number[]
  duplicateTouchAttempts?: number
  completedCountingSequence?: boolean
}

export interface GameSession {
  id: string
  level: LevelId
  startedAt: string
  endedAt: string
  status: "complete" | "incomplete"
  questionsCompleted: number
  totalQuestions: SessionLength
}

export type FeedbackState = "answering" | "incorrect" | "revealed" | "correct"

export interface ActiveSession {
  id: string
  level: LevelId
  startedAt: string
  currentQuestion: GameQuestion
  questionStartedAt: string
  answeredAt: string | null
  questionsCompleted: number
  totalQuestions: SessionLength
  recentAnimalIds: AnimalType[]
  recentItemKeys: string[]
  submittedAnswers: number[]
  bridgeStage?: "partition" | "sum"
  partitionSubmittedAnswers?: number[]
  hintsUsed: number
  feedbackState: FeedbackState
  selectedAnswer: number | null
  activeLearningMs?: number
  touchedObjectIndexes?: number[]
  duplicateTouchAttempts?: number
}

export interface StoredGameData {
  schemaVersion: 3
  appVersion: string
  settings: {
    languagePriority: LanguagePriority
    showEnglish: boolean
    showMaori: boolean
    questionPresentation: QuestionPresentation
    sessionLength: SessionLength
    numberSenseSessionLength: NumberSenseSessionLength
    updatedAt: string
  }
  sessions: GameSession[]
  attempts: QuestionAttempt[]
  activeSession: ActiveSession | null
}

export interface LearnerProfile {
  id: string
  authUserId: string
  displayName: string
  birthMonth: number | null
  birthYear: number | null
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
}
