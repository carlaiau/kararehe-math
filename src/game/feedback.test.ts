import { describe, expect, it } from "vitest"
import {
  animalsRemainingLabel,
  bridgeRemainingRetryFeedback,
  countFeedback,
  quantityAnimal,
  teenNumberRetryFeedback,
} from "@/game/feedback"

describe("quantity-aware animal feedback", () => {
  it("uses a singular verb and noun for a quantity of one", () => {
    expect(countFeedback("tiger", 1, "english-first")).toBe("There is 1 tiger.")
  })

  it("uses a plural verb and noun for quantities greater than one", () => {
    expect(countFeedback("tiger", 3, "english-first")).toBe("There are 3 tigers.")
  })

  it("uses the local quantity when formatting an animal label", () => {
    expect(quantityAnimal("tiger", 1, "english-first")).toBe("1 tiger")
    expect(quantityAnimal("tiger", 3, "english-first")).toBe("3 tigers")
  })

  it("uses a singular verb in remaining-animal accessibility labels", () => {
    expect(animalsRemainingLabel("tiger", 1, "english-first"))
      .toBe("1 tiger remains after making ten")
    expect(animalsRemainingLabel("tiger", 2, "english-first"))
      .toBe("2 tigers remain after making ten")
  })

  it("uses the extra quantity for teen-number retry feedback", () => {
    expect(teenNumberRetryFeedback("tiger", 1, "english-first", "10", "1"))
      .toBe("Here is one group of 10 and 1 more tiger.")
  })

  it("uses the remaining quantity for bridge retry feedback", () => {
    expect(bridgeRemainingRetryFeedback("tiger", 1, "english-first", "10", "1"))
      .toBe("You made 10. Now add the 1 remaining tiger.")
  })
})
