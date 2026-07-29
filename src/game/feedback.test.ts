import { describe, expect, it } from "vitest"
import { countFeedback } from "@/game/feedback"

describe("countFeedback", () => {
  it("uses a singular verb and noun for a quantity of one", () => {
    expect(countFeedback("tiger", 1, "english-first")).toBe("There is 1 tiger.")
  })

  it("uses a plural verb and noun for quantities greater than one", () => {
    expect(countFeedback("tiger", 3, "english-first")).toBe("There are 3 tigers.")
  })
})
