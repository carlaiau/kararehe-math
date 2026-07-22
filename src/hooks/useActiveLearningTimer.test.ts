import { describe, expect, it } from "vitest"
import { ActiveTimer } from "@/hooks/useActiveLearningTimer"

describe("active learning duration", () => {
  it("does not count time while paused", () => {
    let now = 0
    const timer = new ActiveTimer(() => now)
    timer.running = true
    timer.resume()
    now = 1_000
    timer.pause()
    now = 10_000
    timer.resume()
    now = 11_500

    expect(timer.stopAndRead()).toBe(2_500)
  })

  it("caps a question at five minutes", () => {
    let now = 0
    const timer = new ActiveTimer(() => now)
    timer.running = true
    timer.resume()
    now = 900_000

    expect(timer.stopAndRead()).toBe(300_000)
  })
})
