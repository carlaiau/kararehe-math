export type LevelId = 1 | 2

export type LanguagePriority = "english-first" | "maori-first"

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
  visualMode: "ten-frame" | "full-ten-plus-ones"
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
  correctOnFirstAttempt: boolean
  hintsUsed: number
  responseMs: number
}

export interface GameSession {
  id: string
  level: LevelId
  startedAt: string
  endedAt: string
  status: "complete" | "incomplete"
  questionsCompleted: number
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
  recentAnimalIds: AnimalType[]
  submittedAnswers: number[]
  hintsUsed: number
  feedbackState: FeedbackState
  selectedAnswer: number | null
}

export interface StoredGameData {
  schemaVersion: 1
  appVersion: string
  settings: {
    languagePriority: LanguagePriority
  }
  sessions: GameSession[]
  attempts: QuestionAttempt[]
  activeSession: ActiveSession | null
}
