import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BarChart3, Download, Home, Leaf, Play, RotateCcw, Sparkles } from "lucide-react"
import { BilingualTerm } from "@/components/BilingualTerm"
import { LanguagePriorityControl } from "@/components/LanguagePriorityControl"
import { SessionLengthControl } from "@/components/SessionLengthControl"
import { TenFrame } from "@/components/TenFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { getAnimal } from "@/data/animals"
import { generateQuestion, itemKey } from "@/game/questionGenerator"
import { animalTerm, numberTerm } from "@/language/bilingualTerms"
import { exportData, initialData, loadData, saveData } from "@/storage/progressStorage"
import type {
  ActiveSession,
  GameQuestion,
  LanguagePriority,
  LevelId,
  QuestionAttempt,
  SessionLength,
  StoredGameData,
} from "@/types/game"

type Screen = "home" | "game" | "complete" | "parent"

function createSession(level: LevelId, attempts: QuestionAttempt[], totalQuestions: SessionLength): ActiveSession {
  const now = new Date().toISOString()
  const question = generateQuestion(level, attempts, [], 1, totalQuestions, [])
  return {
    id: crypto.randomUUID(),
    level,
    startedAt: now,
    currentQuestion: question,
    questionStartedAt: now,
    answeredAt: null,
    questionsCompleted: 0,
    totalQuestions,
    recentAnimalIds: [question.animal],
    recentItemKeys: [itemKey(question.skill, question.first, question.second)],
    submittedAnswers: [],
    bridgeStage: level === 3 ? "partition" : undefined,
    partitionSubmittedAnswers: level === 3 ? [] : undefined,
    hintsUsed: 0,
    feedbackState: "answering",
    selectedAnswer: null,
  }
}

function App() {
  const [data, setData] = useState<StoredGameData>(() => loadData())
  const [screen, setScreen] = useState<Screen>("home")
  const [pendingLevel, setPendingLevel] = useState<LevelId | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [lastCompletedSessionId, setLastCompletedSessionId] = useState<string | null>(null)

  useEffect(() => saveData(data), [data])

  const languagePriority = data.settings.languagePriority

  const setLanguagePriority = (value: LanguagePriority) => {
    setData((current) => ({ ...current, settings: { ...current.settings, languagePriority: value } }))
  }

  const setSessionLength = (value: SessionLength) => {
    setData((current) => ({ ...current, settings: { ...current.settings, sessionLength: value } }))
  }

  const beginLevel = (level: LevelId) => {
    if (data.activeSession) {
      if (data.activeSession.level === level) {
        setScreen("game")
      } else {
        setPendingLevel(level)
      }
      return
    }
    setData((current) => ({ ...current, activeSession: createSession(level, current.attempts, current.settings.sessionLength) }))
    setScreen("game")
  }

  const endAndStartPending = () => {
    if (pendingLevel === null) return
    setData((current) => {
      const active = current.activeSession
      const sessions = active
        ? [...current.sessions, {
            id: active.id,
            level: active.level,
            startedAt: active.startedAt,
            endedAt: new Date().toISOString(),
            status: "incomplete" as const,
            questionsCompleted: active.questionsCompleted,
            totalQuestions: active.totalQuestions,
          }]
        : current.sessions
      return { ...current, sessions, activeSession: createSession(pendingLevel, current.attempts, current.settings.sessionLength) }
    })
    setPendingLevel(null)
    setScreen("game")
  }

  const answerQuestion = (value: number) => {
    setData((current) => {
      const active = current.activeSession
      if (!active || active.feedbackState === "correct") return current
      if (active.level === 3 && active.bridgeStage !== "sum") {
        const partitionSubmittedAnswers = [...(active.partitionSubmittedAnswers ?? []), value]
        const partitionCorrect = value === 10 - active.currentQuestion.first
        const revealed = !partitionCorrect && partitionSubmittedAnswers.length >= 2
        return {
          ...current,
          activeSession: {
            ...active,
            bridgeStage: partitionCorrect ? "sum" : "partition",
            partitionSubmittedAnswers,
            selectedAnswer: partitionCorrect ? null : value,
            hintsUsed: revealed ? 1 : active.hintsUsed,
            feedbackState: partitionCorrect ? "answering" : revealed ? "revealed" : "incorrect",
          },
        }
      }
      const submittedAnswers = [...active.submittedAnswers, value]
      const correct = value === active.currentQuestion.expectedAnswer
      const revealed = !correct && submittedAnswers.length >= 2
      return {
        ...current,
        activeSession: {
          ...active,
          submittedAnswers,
          selectedAnswer: value,
          answeredAt: correct ? new Date().toISOString() : active.answeredAt,
          hintsUsed: revealed ? 1 : active.hintsUsed,
          feedbackState: correct ? "correct" : revealed ? "revealed" : "incorrect",
        },
      }
    })
  }

  const nextQuestion = () => {
    const active = data.activeSession
    if (!active || active.feedbackState !== "correct") return
    const question = active.currentQuestion
    const attempt: QuestionAttempt = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: active.id,
      level: active.level,
      skill: question.skill,
      itemKey: itemKey(question.skill, question.first, question.second),
      animal: question.animal,
      operands: [question.first, question.second],
      expectedAnswer: question.expectedAnswer,
      submittedAnswers: active.submittedAnswers,
      partitionSubmittedAnswers: active.partitionSubmittedAnswers,
      partitionCorrectOnFirstAttempt: active.partitionSubmittedAnswers?.length === 1,
      correctOnFirstAttempt: active.submittedAnswers.length === 1
        && (active.level !== 3 || active.partitionSubmittedAnswers?.length === 1),
      sumCorrectOnFirstAttempt: active.level === 3 ? active.submittedAnswers.length === 1 : undefined,
      hintsUsed: active.hintsUsed,
      responseMs: Math.max(0, Date.parse(active.answeredAt ?? new Date().toISOString()) - Date.parse(active.questionStartedAt)),
    }
    const attempts = [...data.attempts, attempt]
    const completed = active.questionsCompleted + 1
    if (completed >= active.totalQuestions) {
      setData((current) => ({
        ...current,
        attempts,
        sessions: [...current.sessions, {
          id: active.id,
          level: active.level,
          startedAt: active.startedAt,
          endedAt: new Date().toISOString(),
          status: "complete",
          questionsCompleted: completed,
          totalQuestions: active.totalQuestions,
        }],
        activeSession: null,
      }))
      setLastCompletedSessionId(active.id)
      setScreen("complete")
      return
    }
    const recent = active.recentAnimalIds.slice(-2)
    const recentItems = active.recentItemKeys.slice(-2)
    const next = generateQuestion(active.level, attempts, recent, completed + 1, active.totalQuestions, recentItems)
    setData((current) => ({
      ...current,
      attempts,
      activeSession: {
        ...active,
        currentQuestion: next,
        questionStartedAt: new Date().toISOString(),
        answeredAt: null,
        questionsCompleted: completed,
        recentAnimalIds: [...recent, next.animal].slice(-2),
        recentItemKeys: [...recentItems, itemKey(next.skill, next.first, next.second)].slice(-2),
        submittedAnswers: [],
        bridgeStage: active.level === 3 ? "partition" : undefined,
        partitionSubmittedAnswers: active.level === 3 ? [] : undefined,
        hintsUsed: 0,
        feedbackState: "answering",
        selectedAnswer: null,
      },
    }))
  }

  const resetProgress = () => {
    setData({ ...initialData, settings: data.settings })
    setConfirmReset(false)
    setScreen("home")
  }

  return (
    <div className="min-h-svh">
      {screen !== "game" && (
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
          <button className="brand" onClick={() => setScreen("home")} aria-label="Kararehe Math home">
            <span className="brand-mark"><Leaf className="size-5" /></span>
            <span>Kararehe Math</span>
          </button>
          <div className="header-controls">
            <SessionLengthControl value={data.settings.sessionLength} onChange={setSessionLength} />
            <LanguagePriorityControl value={languagePriority} onChange={setLanguagePriority} />
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8">
        {screen === "home" && (
          <HomeScreen data={data} onBegin={beginLevel} onResume={() => setScreen("game")} onParent={() => setScreen("parent")} />
        )}
        {screen === "game" && data.activeSession && (
          <GameScreen active={data.activeSession} priority={languagePriority} onAnswer={answerQuestion} onNext={nextQuestion} onHome={() => setScreen("home")} />
        )}
        {screen === "complete" && (
          <CompleteScreen data={data} sessionId={lastCompletedSessionId} priority={languagePriority} onHome={() => setScreen("home")} />
        )}
        {screen === "parent" && (
          <ParentScreen data={data} onBack={() => setScreen("home")} onExport={() => exportData(data)} onReset={() => setConfirmReset(true)} />
        )}
      </main>

      <Dialog open={pendingLevel !== null} onOpenChange={(open) => !open && setPendingLevel(null)}>
        <DialogContent>
          <DialogTitle>Start a different level?</DialogTitle>
          <DialogDescription>Your paused session will end as incomplete. Every answered question will stay in the learning history.</DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingLevel(null)}>Keep current session</Button>
            <Button onClick={endAndStartPending}>End and start new</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogTitle>Delete all learning progress?</DialogTitle>
          <DialogDescription>This removes every session and answer stored on this device. Your language-priority setting will stay the same. This cannot be undone in the app.</DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={resetProgress}>Delete progress</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HomeScreen({ data, onBegin, onResume, onParent }: {
  data: StoredGameData
  onBegin: (level: LevelId) => void
  onResume: () => void
  onParent: () => void
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section className="hero-grid py-8 sm:py-14">
        <div>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-balance sm:text-6xl">Helping tamariki become confident with numbers through play.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">Practise making 10, building teen numbers, and turning hard sums into easy sums with friendly kararehe.</p>
        </div>
        <div className="mx-auto flex flex-wrap gap-3 text-3xl pt-4" aria-label="Turtles, whales, tigers, cats, dogs, and penguins">
          {(["turtle", "whale", "tiger", "cat", "dog", "penguin"] as const).map((id) => <span key={id} className="animal-chip w-24 h-24 text-5xl" aria-hidden="true">{getAnimal(id).emoji}</span>)}
        </div>
        
      </section>

      {data.activeSession && (
        <Card className="mb-6 border-accent/40 bg-accent/8">
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black">Your Level {data.activeSession.level} session is waiting</p>
              <p className="text-sm text-muted-foreground">Question {data.activeSession.questionsCompleted + 1} of {data.activeSession.totalQuestions}</p>
            </div>
            <Button onClick={onResume}><Play className="size-5 fill-current" /> Resume</Button>
          </CardContent>
        </Card>
      )}

      <div className="level-grid grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <LevelCard level={1} title="Make 10" subtitle="Find the friends that make ten." emoji="🐢" description="Practise pairs such as 6 and 4, or 7 and 3." onClick={() => onBegin(1)} />
        <LevelCard level={2} title="Build Teen Numbers" subtitle="Build numbers from one full ten and some extra ones." emoji="🐋" description="Build 11 to 19 from one full group of ten and loose ones." onClick={() => onBegin(2)} />
        <LevelCard level={3} title="Make 10 Then Add" subtitle="Make bigger sums easier." emoji="🐕" description="Fill ten first, then add the animals left over." onClick={() => onBegin(3)} />
      </div>
      <div className="mt-6 flex justify-center">
        <Button variant="ghost" onClick={onParent}><BarChart3 className="size-5" /> Parent view</Button>
      </div>
    </div>
  )
}

function LevelCard({ level, title, subtitle, emoji, description, onClick }: { level: LevelId; title: string; subtitle: string; emoji: string; description: string; onClick: () => void }) {
  return (
    <Card className="level-card group">
      <CardHeader className="level-card-header flex flex-row items-start justify-between gap-4">
        <div className="level-card-heading">
          <h2 className="level-card-title text-3xl font-black">{title}</h2>
          <p className="level-card-subtitle mt-1 font-semibold text-muted-foreground">{subtitle}</p>
        </div>
        <span className="level-emoji" aria-hidden="true">{emoji}</span>
      </CardHeader>
      <CardContent className="level-card-content">
        <p className="level-card-description leading-relaxed text-muted-foreground">{description}</p>
        <Button size="lg" className="level-card-action w-full" onClick={onClick}>Start <Play className="size-5 fill-current" /></Button>
      </CardContent>
    </Card>
  )
}

function GameScreen({ active, priority, onAnswer, onNext, onHome }: {
  active: ActiveSession
  priority: LanguagePriority
  onAnswer: (answer: number) => void
  onNext: () => void
  onHome: () => void
}) {
  const question = active.currentQuestion
  const animal = animalTerm(question.animal, question.level === 1 ? 10 : question.first + question.second, priority)
  const correct = active.feedbackState === "correct"
  const isBridge = question.level === 3
  const bridgeStage = active.bridgeStage ?? "partition"
  const partitionComplete = isBridge && bridgeStage === "sum"
  const isMissingBond = question.skill === "bond-missing-second"
  const demonstrated = active.feedbackState !== "answering" && active.selectedAnswer !== null
  const partitionChoices = Array.from({ length: 9 }, (_, index) => ({ value: index + 1, label: String(index + 1) }))
  const displayedChoices = isBridge && bridgeStage === "partition" ? partitionChoices : question.answerChoices
  const displayedAnswers = isBridge && bridgeStage === "partition" ? active.partitionSubmittedAnswers ?? [] : active.submittedAnswers
  const displayedExpectedAnswer = isBridge && bridgeStage === "partition" ? 10 - question.first : question.expectedAnswer
  const displayedEquation = isBridge
    ? question.skill === "bridge-missing-addend"
      ? `${question.first} + ? = ${question.first + question.second}`
      : `${question.first} + ${question.second} = ?`
    : question.equation
  const added = isMissingBond && demonstrated ? active.selectedAnswer ?? 0 : question.skill === "bond-complete" ? question.second : 0
  const filled = question.level === 1 ? question.first : 10

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (correct && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault()
        onNext()
      }
      if (!correct && /^[0-9]$/.test(event.key)) {
        const value = Number(event.key)
        if (displayedChoices.some((choice) => choice.value === value)) onAnswer(value)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [correct, displayedChoices, onAnswer, onNext])

  return (
    <div className="game-screen mx-auto max-w-4xl animate-in fade-in pt-4 duration-300 sm:pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onHome}><span className="brand-mark game-home-mark" aria-hidden="true"><Leaf className="size-4" /></span> Home</Button>
        <p className="font-bold text-muted-foreground">Question {active.questionsCompleted + 1} of {active.totalQuestions}</p>
      </div>
      <Progress value={(active.questionsCompleted / active.totalQuestions) * 100} />

      <Card className="game-card mt-5 overflow-hidden">
        <CardHeader className="question-header text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Level {active.level}</p>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">{isBridge
            ? question.skill === "bridge-missing-addend"
              ? <>How many more <BilingualTerm term={animal} className="animal-name-term" /> make {question.first + question.second}?</>
              : <>How many <BilingualTerm term={animal} className="animal-name-term" /> are there altogether?</>
            : promptWithAnimal(question, animal)}</h1>
          <EquationWithNumberLabels equation={displayedEquation} priority={priority} />
        </CardHeader>
        <CardContent className="game-card-content pt-2">
          {isBridge && partitionComplete && (
            <div className="bridge-partition-success" role="status">
              <strong>Ka pai!</strong>
              <span>{question.first} needs {10 - question.first} to make 10.</span>
            </div>
          )}
          {isBridge && (
            <div className={`bridge-step-prompt ${partitionComplete ? "bridge-step-two" : ""}`} role="status">
              <span>Step {partitionComplete ? "2" : "1"} of 2</span>
              <strong>{partitionComplete ? "Add what’s left" : "Make 10"}</strong>
            </div>
          )}
          <div className={`question-workspace ${partitionComplete ? "bridge-sum-workspace" : ""}`}>
            <div className="question-visual-pane">
              <QuestionVisual
                question={question}
                filled={filled}
                added={added}
                priority={priority}
                bridgeStage={bridgeStage}
              />
            </div>
            {partitionComplete && <BridgeTransformationHero question={question} revealAnswer={correct} />}
            <div className="answer-grid mt-7" key={`${question.id}-${bridgeStage}`} aria-label="Answer choices">
              {displayedChoices.map((choice) => {
                const selected = displayedAnswers.includes(choice.value)
                const isCorrect = correct && choice.value === displayedExpectedAnswer
                return (
                  <button
                    key={choice.value}
                    className={`answer-button ${selected ? "answer-selected" : ""} ${isCorrect ? "answer-correct" : ""}`}
                    onClick={() => isCorrect ? onNext() : onAnswer(choice.value)}
                    disabled={correct && !isCorrect}
                    aria-label={isCorrect ? `Answer ${choice.value}, correct. Continue` : `Answer ${choice.value}`}
                  >
                    <span>{choice.label}</span>
                    {isCorrect && <span className="answer-next-caret" aria-hidden="true"><Play className="size-5 fill-current" /></span>}
                  </button>
                )
              })}
            </div>
          </div>

        </CardContent>
      </Card>
      <div className="confirmation-area">
        {demonstrated && question.level === 2 && (
          <p className="teaching-summary">One ten and {question.second} more make {question.first + question.second}.</p>
        )}
        <Feedback active={active} priority={priority} />
        {correct && <Button size="lg" className="next-button mt-5 w-full sm:mx-auto sm:flex sm:w-56" onClick={onNext}>Next <Play className="size-5 fill-current" /></Button>}
      </div>
    </div>
  )
}

function EquationWithNumberLabels({ equation, priority }: { equation: string; priority: LanguagePriority }) {
  const tokens = equation.match(/\d+|[+?=]/g) ?? [equation]

  return (
    <div className="question-equation-shell mx-auto mt-5">
      <div className="question-equation inline-flex rounded-2xl bg-foreground px-6 py-3 text-3xl font-black text-background sm:text-4xl" aria-label={equation}>
        {tokens.map((token, index) => {
          const value = /^\d+$/.test(token) ? Number(token) : null
          return (
            <span className="question-equation-token" key={`${token}-${index}`} aria-hidden="true">
              <span>{token}</span>
              {value !== null && (
                <span className="question-equation-label">
                  <BilingualTerm term={numberTerm(value, priority)} />
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function promptWithAnimal(question: GameQuestion, animal: ReturnType<typeof animalTerm>) {
  if (question.skill === "bond-missing-second") return <>How many more <BilingualTerm term={animal} className="animal-name-term" /> make 10?</>
  if (question.skill === "teen-missing-ones") return <>{question.first + question.second} is 10 and how many more?</>
  if (question.skill === "bridge-make-ten") return <>Can you fill the ten-frame with the <BilingualTerm term={animal} className="animal-name-term" />?</>
  if (question.skill === "bridge-split") return <>{question.first} needs how many more to make 10?</>
  if (question.skill === "bridge-missing-addend") return <>How many more <BilingualTerm term={animal} className="animal-name-term" /> make {question.first + question.second}?</>
  if (question.skill === "bridge-total") return <>Make 10, then add. How many <BilingualTerm term={animal} className="animal-name-term" /> altogether?</>
  return <>How many <BilingualTerm term={animal} className="animal-name-term" /> are there altogether?</>
}

function QuestionVisual({ question, filled, added, priority, bridgeStage }: { question: GameQuestion; filled: number; added: number; priority: LanguagePriority; bridgeStage: "partition" | "sum" }) {
  const animal = getAnimal(question.animal)
  const names = animalTerm(question.animal, question.first + question.second, priority)
  if (question.level === 3) {
    const toTen = 10 - question.first
    const remainder = question.second - toTen
    if (bridgeStage === "sum") {
      return (
        <div className="bridge-static bridge-completed">
          <TenFrame animal={question.animal} filled={question.first} added={toTen} label={`A full ten-frame with ${question.first} original and ${toTen} moved ${names.primary}.`} />
          <span className="bridge-plus" aria-hidden="true">+</span>
          <div className="bridge-extra-animals" role="img" aria-label={`${remainder} ${names.primary} remain after making ten`}>
            {Array.from({ length: remainder }, (_, index) => <span key={index}>{animal.emoji}</span>)}
          </div>
        </div>
      )
    }
    if (question.skill !== "bridge-missing-addend") {
      return (
        <div className="bridge-static bridge-partition">
          <TenFrame animal={question.animal} filled={question.first} label={`A ten-frame with ${question.first} ${names.primary} and ${10 - question.first} empty spaces.`} />
          <span className="bridge-arrow" role="img" aria-label={`Move some of the ${question.second} extra ${names.primary} into the ten-frame`}>←</span>
          <div className="bridge-extra-animals" role="img" aria-label={`${question.second} extra ${names.primary}`}>
            {Array.from({ length: question.second }, (_, index) => <span key={index}>{animal.emoji}</span>)}
          </div>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-md">
        <TenFrame animal={question.animal} filled={question.first} label={`A ten-frame with ${question.first} ${names.primary} and ${10 - question.first} empty spaces.`} />
      </div>
    )
  }
  if (question.level === 1) {
    if (question.skill === "bond-complete") {
      return (
        <div
          className="addition-groups"
          role="img"
          aria-label={`${question.first} ${names.primary} plus ${question.second} ${names.primary}`}
        >
          <EmojiGroup emoji={animal.emoji} quantity={question.first} />
          <span className="addition-groups-plus" aria-hidden="true">+</span>
          <EmojiGroup emoji={animal.emoji} quantity={question.second} />
        </div>
      )
    }
    const visibleAdded = added
    const overflow = Math.max(0, filled + visibleAdded - 10)
    return (
      <div className="mx-auto max-w-lg">
        <TenFrame animal={question.animal} filled={filled} added={visibleAdded} label={`A ten-frame with ${Math.min(10, filled + visibleAdded)} ${names.primary} and ${Math.max(0, 10 - filled - visibleAdded)} empty spaces.`} />
        {overflow > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-500/60 bg-amber-50 p-3" aria-label={`${overflow} ${names.primary} outside the full ten-frame`}>
            <span className="text-sm font-bold text-amber-900">Too many for the frame:</span>
            {Array.from({ length: overflow }, (_, index) => <span key={index} className="text-3xl" aria-hidden="true">{getAnimal(question.animal).emoji}</span>)}
          </div>
        )}
      </div>
    )
  }
  const missingOnes = question.skill === "teen-missing-ones"
  return (
    <div className="teen-visual mx-auto grid max-w-2xl items-center gap-5 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="mb-2 text-center text-sm font-bold text-muted-foreground">one full ten · kotahi tekau</p>
        <TenFrame animal={question.animal} filled={10} label={`A full ten-frame with ten ${names.primary}.`} />
      </div>
      <div className={`loose-group ${missingOnes ? "loose-group-missing" : ""}`} role="img" aria-label={missingOnes ? `Loose ${names.primary} to count` : `${question.second} extra ${names.primary}`}>
        {Array.from({ length: question.second }, (_, index) => <span key={index} aria-hidden="true">{animal.emoji}</span>)}
        {!missingOnes && <div className="col-span-full mt-1 text-center text-sm"><BilingualTerm term={numberTerm(question.second, priority)} /></div>}
      </div>
    </div>
  )
}

function BridgeTransformationHero({ question, revealAnswer }: { question: GameQuestion; revealAnswer: boolean }) {
  const toTen = 10 - question.first
  const remaining = question.second - toTen
  const total = question.first + question.second
  const missingAddend = question.skill === "bridge-missing-addend"
  const lines = missingAddend
    ? [
        `${question.first} + ? = ${total}`,
        `${question.first} + ${toTen} + ${remaining} = ${total}`,
        `${toTen} + ${remaining} = ?`,
      ]
    : [
        `${question.first} + ${question.second}`,
        `${question.first} + ${toTen} + ${remaining}`,
        `10 + ${remaining}`,
      ]
  const answer = missingAddend ? question.second : total
  return (
    <div className="bridge-proof" role="status" aria-label={revealAnswer ? `The strategy shows the answer is ${answer}` : "The strategy is ready for the final answer"}>
      {lines.map((line, index) => (
        <div key={line} className={`bridge-proof-line bridge-proof-line-${index + 1}`}>
          <span>{line}</span>
          <span className="bridge-proof-down" aria-hidden="true">↓</span>
        </div>
      ))}
      <strong key={revealAnswer ? "answer" : "unknown"} className={`bridge-proof-result ${revealAnswer ? "bridge-proof-answer" : ""}`}>{revealAnswer ? answer : "?"}</strong>
    </div>
  )
}

function EmojiGroup({ emoji, quantity }: { emoji: string; quantity: number }) {
  const animalsPerRow = quantity === 4 || quantity === 6 || quantity === 8 ? quantity / 2 : 5
  const rows = Array.from({ length: Math.ceil(quantity / animalsPerRow) }, (_, rowIndex) =>
    Array.from(
      { length: Math.min(animalsPerRow, quantity - rowIndex * animalsPerRow) },
      (_, columnIndex) => rowIndex * animalsPerRow + columnIndex,
    ),
  )

  return (
    <div className="emoji-group" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div className="emoji-row" key={rowIndex}>
          {row.map((index) => <span key={index}>{emoji}</span>)}
        </div>
      ))}
    </div>
  )
}

function Feedback({ active, priority }: { active: ActiveSession; priority: LanguagePriority }) {
  const question = active.currentQuestion
  if (active.feedbackState === "answering") {
    if (question.level === 3 && active.bridgeStage === "sum") return null
    const instruction = question.level === 3
      ? "Choose how many fit into ten."
      : "Choose the answer that feels right."
    return <p className="mt-5 min-h-14 text-center text-muted-foreground">{instruction}</p>
  }
  const animal = animalTerm(question.animal, question.expectedAnswer, priority)
  if (active.feedbackState === "correct") {
    const equation = question.level === 3 && question.skill !== "bridge-missing-addend"
      ? `${question.first} + ${question.second} = ${question.first + question.second}`
      : question.equation.replace("?", String(question.expectedAnswer))
    return (
      <div className="feedback feedback-good" role="status">
        <span className="text-2xl" aria-hidden="true">🌿</span>
        <div><strong>Ka pai! That’s it.</strong><p>{equation} · <BilingualTerm term={numberTerm(question.expectedAnswer, priority)} /></p></div>
      </div>
    )
  }
  if (active.feedbackState === "revealed") {
    const expected = question.level === 3 && active.bridgeStage !== "sum"
      ? 10 - question.first
      : question.expectedAnswer
    return (
      <div className="feedback feedback-teach" role="status">
        <span className="text-2xl" aria-hidden="true">💡</span>
        <div><strong>Let’s look closely.</strong><p>The answer is {expected}. Now choose {expected} to continue.</p></div>
      </div>
    )
  }
  const selected = active.selectedAnswer ?? 0
  const total = question.skill === "bond-missing-second" ? question.first + selected : selected
  return (
    <div className="feedback feedback-try" role="status">
      <span className="text-2xl" aria-hidden="true">🌱</span>
      <div><strong>Have another look.</strong><p>{question.level === 1
        ? `That makes ${total}. We need ${question.skill === "bond-complete" ? 10 : "a full ten"}.`
        : question.level === 2
          ? `Here is one group of 10 and ${question.second} more ${animal.primary}.`
          : active.bridgeStage === "sum"
            ? question.skill === "bridge-missing-addend"
              ? `You used ${10 - question.first} to make 10, then ${question.second - (10 - question.first)} more. How many were added altogether?`
              : `You made 10. Now add the ${question.second - (10 - question.first)} remaining ${animal.primary}.`
            : `${question.first} needs ${10 - question.first} more to reach 10 first.`}</p></div>
    </div>
  )
}

function CompleteScreen({ data, sessionId, priority, onHome }: { data: StoredGameData; sessionId: string | null; priority: LanguagePriority; onHome: () => void }) {
  const attempts = data.attempts.filter((attempt) => attempt.sessionId === sessionId)
  const firstTry = attempts.filter((attempt) => attempt.correctOnFirstAttempt).length
  const animalsHelped = new Set(attempts.map((attempt) => attempt.animal)).size
  return (
    <div className="mx-auto max-w-2xl py-8 text-center sm:py-16">
      <div className="celebration" aria-hidden="true">🐢 <span>🌿</span> 🐧</div>
      <p className="eyebrow mx-auto w-fit"><Sparkles className="size-4" /> Session complete</p>
      <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">Great work!</h1>
      <p className="mx-auto mt-4 max-w-lg text-xl leading-relaxed text-muted-foreground">You helped {attempts.length} groups of kararehe and kept trying when the numbers got tricky.</p>
      <Card className="mt-8 text-left">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="summary-stat"><strong>{attempts.length}</strong><span>questions explored</span></div>
          <div className="summary-stat"><strong>{firstTry}</strong><span>found on the first try</span></div>
          <div className="summary-stat"><strong>{animalsHelped}</strong><span>kinds of kararehe helped</span></div>
          <div className="summary-stat"><strong><BilingualTerm term={numberTerm(10, priority)} /></strong><span>a full group of ten</span></div>
        </CardContent>
      </Card>
      <Button size="lg" className="mt-8" onClick={onHome}><Home className="size-5" /> Back home</Button>
    </div>
  )
}

function ParentScreen({ data, onBack, onExport, onReset }: { data: StoredGameData; onBack: () => void; onExport: () => void; onReset: () => void }) {
  const metrics = useMemo(() => {
    const attempts = data.attempts
    const firstTry = attempts.filter((attempt) => attempt.correctOnFirstAttempt).length
    const hints = attempts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0)
    const average = attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.responseMs, 0) / attempts.length / 1000 : 0
    return { attempts: attempts.length, accuracy: attempts.length ? Math.round((firstTry / attempts.length) * 100) : 0, hints, average }
  }, [data.attempts])
  const recent = [...data.attempts].slice(-8).reverse()
  const levelThreeAttempts = data.attempts.filter((attempt) => attempt.level === 3)
  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="size-5" /> Back</Button>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow w-fit"><BarChart3 className="size-4" /> Grown-up view</p><h1 className="mt-3 text-4xl font-black">Learning progress</h1><p className="mt-2 text-muted-foreground">One learner · stored only on this device</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onExport}><Download className="size-4" /> Export JSON</Button><Button variant="danger" onClick={onReset}><RotateCcw className="size-4" /> Reset progress</Button></div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Questions" value={String(metrics.attempts)} />
        <Metric label="First-try accuracy" value={`${metrics.accuracy}%`} />
        <Metric label="Hints used" value={String(metrics.hints)} />
        <Metric label="Average response" value={`${metrics.average.toFixed(1)}s`} />
      </div>
      {levelThreeAttempts.length > 0 && <LevelThreeProgress attempts={levelThreeAttempts} />}
      <Card className="mt-6 overflow-hidden">
        <CardHeader><h2 className="text-2xl font-black">Recent practice</h2></CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-2 sm:px-0">
          {recent.length === 0 ? <p className="px-6 pb-6 text-muted-foreground sm:px-8">No questions answered yet. Learning history will appear here.</p> : (
            <table className="w-full min-w-[620px] text-left">
              <thead><tr><th>Practice item</th><th>Level</th><th>First try</th><th>Hints</th><th>Time</th></tr></thead>
              <tbody>{recent.map((attempt) => <tr key={attempt.id}><td className="font-bold">{attempt.itemKey.replaceAll(":", " · ")}</td><td>{attempt.level}</td><td>{attempt.correctOnFirstAttempt ? "Yes" : "Not yet"}</td><td>{attempt.hintsUsed}</td><td>{(attempt.responseMs / 1000).toFixed(1)}s</td></tr>)}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LevelThreeProgress({ attempts }: { attempts: QuestionAttempt[] }) {
  const rows = [
    {
      label: "Make 10 then add",
      matches: (attempt: QuestionAttempt) => attempt.skill !== "bridge-missing-addend",
      succeeds: (attempt: QuestionAttempt) => attempt.sumCorrectOnFirstAttempt ?? attempt.correctOnFirstAttempt,
    },
    {
      label: "Number partitioning",
      matches: () => true,
      succeeds: (attempt: QuestionAttempt) => attempt.partitionCorrectOnFirstAttempt ?? attempt.correctOnFirstAttempt,
    },
  ]
  return (
    <Card className="mt-6">
      <CardHeader><h2 className="text-2xl font-black">Level 3 strategies</h2></CardHeader>
      <CardContent className="space-y-5">
        {rows.map((row) => {
          const matching = attempts.filter(row.matches)
          const correct = matching.filter(row.succeeds).length
          const value = matching.length ? Math.round((correct / matching.length) * 100) : 0
          return (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between gap-4"><span className="font-bold">{row.label}</span><span className="text-sm text-muted-foreground">{matching.length} attempts · {value}% first try</span></div>
              <Progress value={value} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-5 sm:p-6"><p className="text-sm font-bold text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></CardContent></Card>
}

export default App
