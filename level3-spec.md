## Level 3: Bridging through ten

# Overview

Level 3 introduces **bridging through 10** ("make ten"), which is one of the most important mental arithmetic strategies in early primary mathematics.

Unlike Level 1 (number bonds) and Level 2 (teen numbers), Level 3 teaches a **strategy**, not a collection of facts.

Children learn to transform problems such as:

```text
8 + 5
```

into

```text
8 + 2 + 3

↓

10 + 3

↓

13
```

The objective is for this transformation to become an internal mental model rather than a memorised procedure.

---

# Learning objectives

By the end of Level 3 the child should be able to:

- recognise when an addition crosses ten
- identify how many are required to complete ten
- split the second number into two parts
- complete ten first
- add the remaining ones
- solve bridging problems without counting from one

---

# Educational progression

## Phase 1 — Fully visual

Display a ten-frame containing the first number.

Example:

```text
8 + 5
```

Visual:

```text
🐧 🐧 🐧 🐧 🐧
🐧 🐧 🐧 □ □

Extra:
🐧 🐧 🐧 🐧 🐧
```

Prompt: **Can you fill the ten-frame?**

The child drags **2** animals into the empty spaces.

Animation:

```text
8 + 5
↓
8 + 2 + 3
↓
10 + 3
↓
13
```

## Phase 2 — Assisted partitioning

Ask:

```text
8 needs how many more to make 10?
```

Then animate the remaining animals.

## Phase 3 — Strategy recognition

Ask how to split the second number.

Example:

```text
8 + 5

Choices:
5
2 + 3
1 + 4
```

## Phase 4 — Independent strategy

Show only the equation initially.

A **Show animals** button remains available as a hint.

---

# Question bank

Use only totals up to 20.

```text
8 + 3
8 + 4
8 + 5
7 + 4
7 + 5
7 + 6
6 + 5
6 + 6
6 + 7
9 + 2
9 + 3
9 + 4
9 + 5
```

---

# Deferred missing-addend progression

Missing-addend bridging is not included in the current Level 3 question mix. Keep this progression for a later level or a future extension after the complete-addend strategy is fluent:

```text
6 + ? = 15
8 + ? = 13
9 + ? = 16
7 + ? = 12
```

Animate:

```text
6 + ? = 15
↓
6 needs 4
↓
10 reached
↓
Need another 5
↓
4 + 5 = 9
```

---

# Suggested React components

```text
BridgeAnimation.tsx
SplitNumber.tsx
HintPanel.tsx
```

```ts
interface BridgeAnimationProps {
  first: number;
  second: number;
  splitLeft: number;
  splitRight: number;
  animal: AnimalType;
}
```

---

# Adaptive tracking

Track mastery independently for:

- Making ten
- Splitting numbers
- Completing the final addition
- Missing-addend questions
- Hint usage

---

# Parent dashboard

Display separate mastery bars for:

- Bridge through ten
- Number partitioning
- Missing addends (deferred; do not display this bar in the current build)

Record common misconceptions:

- Counts every object from one
- Incorrect partition
- Forgets the remaining ones
- Relies on hints

---

# Acceptance criteria

- Child can complete a ten-frame by moving animals.
- The partitioning strategy is animated.
- Hints teach rather than reveal.
- Strategy mastery is stored separately from answer accuracy.
- Level 3 reuses existing Level 1 and Level 2 components.

---

# First implementation decisions

- Level 3 is always available from the home screen.
- Every Level 3 question has two required steps: identify the partition that completes ten, then choose the final answer.
- The original problem, such as `8 + 5 = ?`, remains the main equation throughout both steps. The temporary make-ten question is presented as a labelled strategy instruction, not as a replacement equation.
- During visual partitioning, a directional arrow points from the extra animals toward the ten-frame instead of repeating the partition instruction in a text banner.
- Introductory partition steps let the child tap or drag animals into the ten-frame so the interaction works on touch devices and with a mouse.
- Later partition steps use the ordered 1–9 answer grid to identify how many complete ten.
- After the partition is complete, the transformed `10 + remainder = ?` equation and ordered 11–19 answer grid are shown. The question is not complete until the child chooses the final sum.
- Level 3 currently uses complete-addend equations only, such as `6 + 5 = ?`. Do not generate `6 + ? = 11` questions in this level.
- Step 1 is labelled `Make 10`. After a correct partition, show `Ka pai! first needs toTen to make 10`, animate the animals completing the ten-frame, and change the label to Step 2, `Add what’s left`.
- The transformation is the central teaching visual rather than a bottom breadcrumb. Reveal `first + second`, then `first + toTen + remainder`, then `10 + remainder`, and keep the final line as `?` until the child chooses the answer.
- Adaptive history is stored independently under `bridge-make-ten`, `bridge-split`, and `bridge-total`.
- The Parent view shows separate progress for bridging and partitioning.
