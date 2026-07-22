export type LevelId = 1 | 2 | 3

export type LanguagePriority = "english-first" | "maori-first"
export type QuestionPresentation = "numbers" | "english-words" | "maori-words"
export type SessionLength = 10 | 20 | 30

export type AnimalType =
  | "turtle"
  | "whale"
  | "tiger"
  | "cat"
  | "dog"
  | "penguin"

export type QuestionSkill =
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
  visualMode: "ten-frame" | "full-ten-plus-ones" | "bridge" | "equation-only"
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
}

export interface StoredGameData {
  schemaVersion: 2
  appVersion: string
  settings: {
    languagePriority: LanguagePriority
    showEnglish: boolean
    showMaori: boolean
    questionPresentation: QuestionPresentation
    sessionLength: SessionLength
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
