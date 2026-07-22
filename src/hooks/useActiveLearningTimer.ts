import { useEffect, useRef } from "react"

const MAX_QUESTION_MS = 5 * 60 * 1000

export class ActiveTimer {
  accumulated = 0
  startedAt: number | null = null
  running = false

  constructor(private readonly now: () => number = () => performance.now()) {}

  reset() {
    this.accumulated = 0
    this.startedAt = null
  }

  pause() {
    if (this.startedAt !== null) {
      this.accumulated = Math.min(MAX_QUESTION_MS, this.accumulated + this.now() - this.startedAt)
      this.startedAt = null
    }
  }

  resume() {
    if (this.running && this.startedAt === null && this.accumulated < MAX_QUESTION_MS) {
      this.startedAt = this.now()
    }
  }

  stopAndRead() {
    this.running = false
    this.pause()
    return Math.round(Math.min(MAX_QUESTION_MS, this.accumulated))
  }
}

export function useActiveLearningTimer(questionId: string | null, running: boolean) {
  const timerRef = useRef(new ActiveTimer())
  const resumeIfActive = () => {
    if (document.visibilityState === "visible" && document.hasFocus()) timerRef.current.resume()
  }

  useEffect(() => {
    const timer = timerRef.current
    timer.reset()
    timer.running = questionId !== null
    resumeIfActive()
  }, [questionId])

  useEffect(() => {
    const timer = timerRef.current
    timer.running = running
    if (running) resumeIfActive()
    else timer.pause()
  }, [running])

  useEffect(() => {
    const timer = timerRef.current
    const handleVisibility = () => document.visibilityState === "visible" ? resumeIfActive() : timer.pause()
    const handleFocus = () => resumeIfActive()
    const handleBlur = () => timer.pause()
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)
    return () => {
      timer.pause()
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  return { stopAndRead: () => timerRef.current.stopAndRead() }
}
