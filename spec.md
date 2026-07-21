# MVP Specification: Kararehe Math — Bonds to 10 and Teen Numbers

## 1. Product overview

Build a small, browser-based maths game named **Kararehe Math** for a Year 2 child in New Zealand.

“Kararehe” means animal. The interface is written in English, while number names and animal names are shown in English and te reo Māori together. A persisted setting controls which language is presented first and with greater visual emphasis.

The MVP teaches two foundational skills:

1. **Number bonds to 10**
2. **Understanding teen numbers as one ten plus extra ones**

The game should be visual, calm, encouraging, and usable on both desktop and tablet. Questions use randomly selected animals:

- Turtles
- Whales
- Tigers
- Cats
- Dogs
- Penguins

The selected animal should change between questions to provide variety, but the animal choice must not affect the mathematical difficulty.

---

## 2. Learning objectives

### Level 1: Number bonds to 10

A **number bond to 10** is a pair of numbers that combine to make 10.

Examples:

```text
1 + 9 = 10
2 + 8 = 10
3 + 7 = 10
4 + 6 = 10
5 + 5 = 10
```

The objective is for the child to move from calculating these combinations slowly to recognising them automatically.

The level should practise both complete equations and missing-number equations:

```text
7 + 3 = 10
7 + ? = 10
? + 3 = 10
```

Missing-number equations are harder and should be introduced after the corresponding complete number bond has been practised.

### Level 2: Teen numbers

A teen number is represented as:

```text
one group of 10 + some extra ones
```

Examples:

```text
13 = 10 + 3
16 = 10 + 6
19 = 10 + 9
```

The objective is for the child to understand teen numbers as quantities, rather than merely recognising their written digits.

The level should connect these equivalent representations:

```text
14
10 + 4
one complete group of 10 animals plus 4 extra animals
```

---

## 3. Technical scope

### Required technology

Build as a client-side web application using:

- **Vite**
- **React**
- **TypeScript**
- **shadcn/ui** for accessible interface components
- HTML and CSS
- No backend for the MVP
- No authentication
- No external database

Use `localStorage` to preserve all progress and session history as a versioned JSON document.

Use shadcn/ui selectively for buttons, cards, dialogs, progress indicators, tabs, and Parent view controls. Maths content, animal counters, and ten-frames remain purpose-built accessible React components. Use ordinary CSS for restrained transitions and celebration states, and respect reduced-motion preferences.

### Supported devices

The application should work on:

- Desktop browsers
- iPad/tablet browsers
- Mobile browsers in landscape or portrait

Primary interaction:

- Mouse
- Touch
- Keyboard number input where appropriate

---

## 4. Core user flow

### Start screen

Display:

```text
Kararehe Math
Choose a level
```

Animal and number vocabulary on this screen follows the saved English-first or Māori-first priority setting. General navigation remains English.

Level buttons:

```text
Level 1: Make 10
Level 2: Teen Numbers
```

Both levels remain unlocked in the MVP. Adaptive progression occurs within the level selected by the child; selecting a level starts a level-specific session.

Also provide:

```text
Parent view
Reset progress
```

The MVP supports one learner profile per browser/device. It does not include profile creation or switching.

### Question flow

For every question:

1. Randomly select one animal type.
2. Generate a question appropriate to the selected level and current mastery.
3. Display the mathematical representation and animal visualisation.
4. Allow the child to answer.
5. Provide immediate visual feedback.
6. If incorrect, show a teaching animation or visual hint.
7. Continue to the next question.
8. Finish after exactly 10 questions.

Do not display a countdown timer or end a session based on elapsed time.

---

## 5. Animal system

### Supported animals

Define a fixed list:

```ts
type AnimalType =
  | "turtle"
  | "whale"
  | "tiger"
  | "cat"
  | "dog"
  | "penguin";
```

Each animal should have:

```ts
interface AnimalDefinition {
  id: AnimalType;
  singularName: string;
  pluralName: string;
  imageUrl?: string;
  emojiFallback: string;
  altText: string;
}
```

Example:

```ts
const animals: AnimalDefinition[] = [
  {
    id: "turtle",
    singularName: "turtle",
    pluralName: "turtles",
    emojiFallback: "🐢",
    altText: "A cartoon turtle"
  },
  {
    id: "whale",
    singularName: "whale",
    pluralName: "whales",
    emojiFallback: "🐋",
    altText: "A cartoon whale"
  },
  {
    id: "tiger",
    singularName: "tiger",
    pluralName: "tigers",
    emojiFallback: "🐯",
    altText: "A cartoon tiger"
  },
  {
    id: "cat",
    singularName: "cat",
    pluralName: "cats",
    emojiFallback: "🐱",
    altText: "A cartoon cat"
  },
  {
    id: "dog",
    singularName: "dog",
    pluralName: "dogs",
    emojiFallback: "🐶",
    altText: "A cartoon dog"
  },
  {
    id: "penguin",
    singularName: "penguin",
    pluralName: "penguins",
    emojiFallback: "🐧",
    altText: "A cartoon penguin"
  }
];
```

For the MVP, emoji animals are acceptable. The implementation should allow the emoji to be replaced later with custom illustrations.

### Random selection

Select a new animal for every question.

Avoid showing the same animal more than twice consecutively.

```ts
function chooseAnimal(
  animals: AnimalDefinition[],
  recentAnimalIds: AnimalType[]
): AnimalDefinition;
```

The mathematics must remain unchanged regardless of animal choice.


## 5.1 Bilingual learning vocabulary

### Language priority

The general interface, navigation, prompts, feedback, Parent view, and accessibility instructions are written in English. The game always presents animal names and number names in both English and te reo Māori.

The MVP supports a persisted priority setting:

```ts
type LanguagePriority = "english-first" | "maori-first";
```

English is primary on first use. The setting changes the order and visual emphasis of learning vocabulary; it does not hide either language or translate the whole interface.

Examples:

```text
English first: penguins · kororā
Māori first:   kororā · penguins

English first: 14 — fourteen · tekau mā whā
Māori first:   14 — tekau mā whā · fourteen
```

Mathematical numerals and operators remain unchanged. Answer buttons use large numerals only.

### Animal translations

Use the following initial translation map:

```ts
const animalNames = {
  turtle: {
    en: { singular: "turtle", plural: "turtles" },
    mi: { singular: "honu", plural: "honu" }
  },
  whale: {
    en: { singular: "whale", plural: "whales" },
    mi: { singular: "tohorā", plural: "tohorā" }
  },
  tiger: {
    en: { singular: "tiger", plural: "tigers" },
    mi: { singular: "taika", plural: "taika" }
  },
  cat: {
    en: { singular: "cat", plural: "cats" },
    mi: { singular: "ngeru", plural: "ngeru" }
  },
  dog: {
    en: { singular: "dog", plural: "dogs" },
    mi: { singular: "kurī", plural: "kurī" }
  },
  penguin: {
    en: { singular: "penguin", plural: "penguins" },
    mi: { singular: "kororā", plural: "kororā" }
  }
} as const;
```

Do not apply English pluralisation rules to te reo Māori nouns.

### Number translations

Support number words from 0 through 20:

```ts
const numberWordsMi: Record<number, string> = {
  0: "kore",
  1: "tahi",
  2: "rua",
  3: "toru",
  4: "whā",
  5: "rima",
  6: "ono",
  7: "whitu",
  8: "waru",
  9: "iwa",
  10: "tekau",
  11: "tekau mā tahi",
  12: "tekau mā rua",
  13: "tekau mā toru",
  14: "tekau mā whā",
  15: "tekau mā rima",
  16: "tekau mā ono",
  17: "tekau mā whitu",
  18: "tekau mā waru",
  19: "tekau mā iwa",
  20: "rua tekau"
};
```

Number words may appear beside numerals in prompts, visual explanations, and feedback, but not inside answer buttons. Animal and number vocabulary must be resolved through central data helpers rather than embedded in components so spelling and presentation can be reviewed without changing game logic.

Suggested structure:

```text
src/
  data/
    animals.ts
    numberWords.ts
  language/
    bilingualTerms.ts
    languagePriority.ts
```

The te reo Māori vocabulary may be used provisionally during development but should be reviewed by a fluent speaker before Māori vocabulary is treated as ready for real learning use.


---

## 6. Level 1 specification: Make 10

### Level objective

Teach and automate number bonds to 10.

The complete set of target pairs is:

```ts
const bondsToTen = [
  [1, 9],
  [2, 8],
  [3, 7],
  [4, 6],
  [5, 5],
  [6, 4],
  [7, 3],
  [8, 2],
  [9, 1]
];
```

Zero may be excluded initially.

### Level 1 question types

#### Type A: Complete addition fact

Example:

```text
7 + 3 = ?
```

Display:

- One unframed group of 7 animals
- A second unframed group of 3 animals beside it
- A plus sign between the groups
- Answer choices or number input

Do not use the ten-frame for complete “altogether” questions. The two loose groups make the child attend to the equation and quantities without revealing the answer through a visibly full frame. This confirms that the child understands the complete bond.

#### Type B: Missing second addend

Example:

```text
7 + ? = 10
```

Display:

- A container with 10 available positions
- 7 positions filled with animals
- 3 empty positions
- Ask: “How many more animals do we need to make 10?”

This should be the primary Level 1 question type.

#### Type C: Missing first addend

Example:

```text
? + 3 = 10
```

This is mathematically equivalent but visually and cognitively more difficult.

Defer this type from the first playable MVP. It may be introduced after Type B questions are reasonably successful in a later iteration.

#### Type D: Select the matching bond

Example:

```text
Which one makes 10?
```

Choices:

```text
7 + 2
7 + 3
7 + 4
```

Defer this type from the first playable MVP.

### Level 1 visual design

Use a **ten-frame** or a clearly bounded area with ten fixed spaces for missing-addend questions. Use two unframed emoji groups arranged side by side for complete “altogether” questions.

Example:

```text
🐢 🐢 🐢 🐢 🐢
🐢 🐢 □  □  □
```

Question:

```text
7 + ? = 10
```

Prompt:

```text
How many more turtles make 10?
```

The empty spaces should remain visible so the missing quantity can be perceived spatially.

The ten-frame should always use the same arrangement:

```text
5 positions on the first row
5 positions on the second row
```

Do not randomly scatter animals around the screen for instructional questions. Spatial consistency helps the child recognise quantities without recounting.

### Level 1 answer interface

For the MVP, use nine large answer buttons in a 3 × 3 grid.

For example, for:

```text
7 + ? = 10
```

Display an ordered grid containing the full `1–9` range for missing-addend questions:

```text
1  2  3
4  5  6
7  8  9
```

Requirements:

- Exactly one correct answer
- Missing-addend grids contain 1–9
- Complete-bond grids contain nine values around 10, such as 6–14
- Do not include negative numbers
- Keep values in ascending order from left to right and top to bottom
- Make buttons large enough for touch use

A numeric keypad can be added later.

### Correct-answer behaviour

When correct:

1. For a missing-addend question, fill the empty positions with the chosen number of animals and show the complete ten-frame.
2. For an “altogether” question, keep the two emoji groups visible and gently emphasise the completed equation.
3. Display a short message such as:

```text
Yes! 7 and 3 make 10.
```

4. Optionally animate the animals gently.
5. Display a large **Next** button immediately and keep the completed visual visible until the child activates it. Support Enter and Space as keyboard shortcuts.

Avoid overstimulating effects.

### Incorrect-answer behaviour

Do not use harsh messages such as:

```text
Wrong
Incorrect
Try harder
```

Instead:

1. Add the selected number of animals into the frame.
2. Show whether the total is too small or too large.
3. Use a message such as:

```text
That makes 9. We need 10.
```

or:

```text
That makes 11. We only need 10.
```

4. Return the animals to their original state.
5. Allow another attempt.

After two incorrect attempts, show the visual answer:

```text
7 animals are here.
There are 3 empty spaces.
7 and 3 make 10.
```

Then require the child to select or enter `3` before continuing.

The game should not immediately move on after revealing the answer.

### Level 1 progression

#### Phase 1: Familiarisation

Show full visual support.

Question format:

```text
7 + ? = 10
```

Show seven animals and three clearly visible empty spaces.

#### Phase 2: Reduced support

Show the ten-frame but make the empty spaces less prominent.

#### Phase 3: Symbolic question

Show:

```text
7 + ? = 10
```

Do not initially show the animals.

Provide a button:

```text
Show animals
```

Using this button counts as a hint.

#### Phase 4: Mixed orientation

Mix:

```text
7 + ? = 10
? + 3 = 10
7 + 3 = ?
```

For the initial MVP, support complete-bond familiarisation and missing-second questions with full or reduced visual support. Defer missing-first and matching-bond formats.

### Level 1 mastery calculation

Track mastery separately for each ordered bond and question format. For example, `7 + 3`, `3 + 7`, `7 + 3 = ?`, and `7 + ? = 10` are distinct practice items even when they share quantities.

```ts
interface BondMastery {
  first: number;
  second: number;
  attempts: number;
  correctFirstAttempt: number;
  correctAfterHint: number;
  incorrectAttempts: number;
  averageResponseMs: number;
  recentResults: boolean[];
  masteryScore: number;
}
```

Suggested mastery score:

```ts
masteryScore =
  accuracyScore * 0.7 +
  independenceScore * 0.2 +
  fluencyScore * 0.1;
```

For the first MVP, use this simpler rule:

A bond is considered learned when:

- At least five attempts have occurred
- At least four of the most recent five were correct on the first attempt

Do not require fast answers initially.

Hint-assisted or eventually corrected answers are recorded but do not count as first-attempt mastery. A missing-second form is unlocked for an ordered bond after the child answers its corresponding complete form correctly once on the first attempt.

Response time should be recorded but should not be shown to the child.

### Question selection

Questions should not be uniformly random.

Prefer:

1. Bonds answered incorrectly
2. Bonds not recently seen
3. Bonds that are correct but slow
4. Previously mastered bonds for spaced review

Example weighting:

```text
incorrect recently: weight 5
not yet attempted: weight 4
correct but slow: weight 3
mastered: weight 1
```

Do not repeatedly present the same bond more than twice in succession.

---

## 7. Level 2 specification: Teen Numbers

### Level objective

Teach that numbers from 11 to 19 are composed of:

```text
one ten + a number of ones
```

Examples:

```text
12 = 10 + 2
15 = 10 + 5
18 = 10 + 8
```

This level is intended to address errors where the child focuses on or accidentally changes only the ones digit.

### Number range

Use:

```ts
const teenNumbers = [11, 12, 13, 14, 15, 16, 17, 18, 19];
```

Ten and twenty may be included as boundary examples later.

### Level 2 representation

Use:

- One complete ten-frame containing 10 animals
- A separate area containing 1–9 additional animals

Example for 14:

```text
Full ten-frame:

🐧 🐧 🐧 🐧 🐧
🐧 🐧 🐧 🐧 🐧

Extra animals:

🐧 🐧 🐧 🐧
```

Display:

```text
10 + 4 = 14
```

The group of ten should be visually distinct from the loose ones.

### Level 2 question types

#### Type A: Count the total

Show:

- One full group of 10 animals
- Some loose animals

Ask:

```text
How many cats are there altogether?
```

Example answer:

```text
14
```

#### Type B: Complete the addition equation

Show:

```text
10 + 6 = ?
```

Also show:

- One group of 10 animals
- Six loose animals

Correct answer:

```text
16
```

#### Type C: Identify the ones

Show:

```text
17
```

Ask:

```text
17 is 10 and how many more?
```

Correct answer:

```text
7
```

Alternative equation:

```text
10 + ? = 17
```

#### Type D: Identify the teen number

Show:

```text
10 + 3
```

Ask:

```text
Which number is this?
```

Correct answer:

```text
13
```

#### Type E: Build the number

Show:

```text
Build 15
```

Provide:

- One draggable ten-group
- Individual animal counters

The correct construction is:

```text
one ten-group + five individual animals
```

This interaction is desirable but may be deferred if drag-and-drop would expand MVP scope too much.

The first playable MVP supports Types A–D and defers Type E.

### Level 2 answer interface

Use nine large answer choices in an ordered 3 × 3 grid.

For:

```text
10 + 6 = ?
```

The grid contains every teen number from 11 through 19:

```text
11  12  13
14  15  16
17  18  19
```

For:

```text
10 + ? = 17
```

The grid contains every ones value from 1 through 9:

```text
1  2  3
4  5  6
7  8  9
```

Keep positions stable and ascending from left to right, then top to bottom. This makes the grid quick to scan and reinforces numerical order. All nine values stay within the concept currently being practised.

### Level 2 incorrect-answer behaviour

Suppose the question is:

```text
10 + 6 = ?
```

and the child selects `15`.

The game should:

1. Highlight the complete group of ten.
2. Count or reveal the six loose animals.
3. Display:

```text
Here is one group of 10.
There are 6 more.
10 and 6 make 16.
```

4. Visually associate:

```text
10 + 6 = 16
```

5. Require the correct answer before moving on.

Do not simply replace the incorrect answer with the correct one.

### Level 2 progression

#### Phase 1: Visual to numeral

Show animals and ask for the total.

```text
10 animals + 4 animals = ?
```

#### Phase 2: Equation plus visual

Show:

```text
10 + 4 = ?
```

with the animal representation underneath.

#### Phase 3: Equation only

Show:

```text
10 + 4 = ?
```

Provide an optional:

```text
Show animals
```

button.

#### Phase 4: Missing ones

Show:

```text
10 + ? = 14
```

This phase is particularly important because missing-number equations are harder for the child.

For each teen number, unlock the formats gradually:

1. Begin by counting a visible ten-group and loose ones.
2. After one first-attempt success, unlock forward `10 + n` equation and identification forms.
3. After one first-attempt success in a complete form, unlock the missing-ones `10 + ? = teen` form.
4. Keep earlier formats available for targeted practice and review.

Track mastery independently for each teen number and question format, using the same five-attempt/four-first-attempt-success rule as Level 1.

---

## 8. Initial adaptive progression

The game uses lightweight adaptation from the first playable build. It begins with easier, highly supported questions, favours practice items answered incorrectly or not yet seen, and gradually unlocks harder formats using the rules defined within each level. Do not implement a complex numeric mastery formula for the MVP.

Suggested sequence:

```text
Level 1A:
Complete number bonds with visible animals

Level 1B:
Missing second number with visible empty spaces

Level 1C:
Missing first number with visual support

Level 2A:
Count one ten-group and loose ones

Level 2B:
Solve 10 + n

Level 2C:
Solve 10 + ? = teen number
```

Do not introduce bridging questions such as:

```text
6 + 9
13 + 7
6 + ? = 15
```

in the initial two-level MVP.

Those should become a later Level 3 after number bonds and teen-number structure are more fluent.

---

## 9. Session design

A session contains exactly ten questions from the selected level.

Use this as a soft target rather than a rigid quota:

```text
7 targeted questions
2 review questions
1 easy confidence-building question
```

When there is little history, fill unavailable categories with introductory questions. A confidence-building question uses a previously successful item with full visual support; if none exists, use an easy introductory item.

Only one session may be active at a time. Persist its session ID, selected level, generated current question, submitted answers, feedback state, and completed-question count after every state change. A refresh or browser restart resumes the exact session and question.

Returning home pauses the active session and presents a prominent **Resume** action. Starting another level while a session is paused requires confirmation; the old session is marked incomplete, while all completed attempts remain recorded.

At the end, show:

```text
Great work!
You helped 10 groups of animals.
```

Display child-friendly progress without grades:

```text
Bonds practised: 2 + 8, 3 + 7, 4 + 6
Teen numbers practised: 13, 16, 18
```

Avoid:

```text
You scored 60%
You failed 4 questions
```

The parent view can show precise statistics.

---

## 10. Parent view

Provide a simple hidden or separate parent screen.

Access is through a visually secondary button on the start screen. The MVP does not require a PIN or adult challenge. Export, reset, and ending an active session use explicit confirmation dialogs.

Display:

- Questions attempted
- First-attempt accuracy
- Hints used
- Average response time
- Performance by number bond
- Performance by teen number
- Common incorrect answers

Example:

```text
Number bond: 2 + 8
Attempts: 6
Correct first attempt: 3
Hints used: 2
Average response: 8.4 seconds
Status: Developing
```

Example teen-number data:

```text
Teen number: 13
Recognises 10 + 3: Yes
Can identify missing ones: Not yet
Average response: 6.2 seconds
```

### Parent data model

```ts
interface QuestionAttempt {
  id: string;
  timestamp: string;
  sessionId: string;
  level: 1 | 2;
  skill:
    | "bond-complete"
    | "bond-missing-second"
    | "teen-count-total"
    | "teen-add-ten"
    | "teen-missing-ones"
    | "teen-identify-number";
  animal: AnimalType;
  operands: number[];
  expectedAnswer: number;
  submittedAnswers: number[];
  correctOnFirstAttempt: boolean;
  hintsUsed: number;
  responseMs: number;
}
```

Persist attempts in `localStorage` as one versioned JSON blob.

Use a versioned storage structure:

```ts
interface StoredGameData {
  schemaVersion: 1;
  exportedAt?: string;
  appVersion: string;
  settings: {
    languagePriority: LanguagePriority;
    reducedMotionOverride?: boolean;
  };
  sessions: GameSession[];
  attempts: QuestionAttempt[];
  currentProgress: PlayerProgress;
  activeSession: ActiveSession | null;
}
```

Use a stable storage key:

```ts
const STORAGE_KEY = "kararehe-math:data";
```

Writes should be defensive:

1. Read the existing blob.
2. Parse inside `try/catch`.
3. Validate or migrate the schema.
4. Apply the update immutably.
5. Serialize and write the complete document.
6. Recover safely from malformed or unsupported data.

Do not scatter progress across many unrelated local-storage keys.

### Export and reset

The parent view must provide:

```text
Export progress
Reset progress
```

#### Export

Export the complete `StoredGameData` document as a downloadable JSON file.

Suggested filename:

```text
kararehe-math-progress-YYYY-MM-DD.json
```

The export should include:

- Schema version
- App version
- Settings
- Sessions
- Attempts
- Mastery/progress state
- Export timestamp

Import is deferred from the first playable MVP. Reset deletes sessions, attempts, mastery state, and the active session after explicit confirmation, while preserving device settings such as language priority.

---

## 11. Suggested application architecture

```text
src/
  app/
    App.ts
    routes.ts

  components/
    AnimalCounter.ts
    TenFrame.ts
    AnswerButtons.ts
    QuestionPrompt.ts
    FeedbackPanel.ts
    ProgressIndicator.ts

  game/
    questionGenerator.ts
    questionSelector.ts
    masteryCalculator.ts
    feedbackEngine.ts
    sessionManager.ts

  levels/
    level1/
      level1Questions.ts
      Level1Screen.ts
    level2/
      level2Questions.ts
      Level2Screen.ts

  data/
    animals.ts
    numberWords.ts

  language/
    bilingualTerms.ts
    languagePriority.ts

  storage/
    progressStorage.ts
    schema.ts
    migrations.ts
    exportData.ts

  components/ui/
    # shadcn/ui components used by the app

  parent/
    ParentDashboard.ts

  types/
    game.ts
```

---

## 12. Core TypeScript types

```ts
type LevelId = 1 | 2;

type QuestionSkill =
  | "bond-complete"
  | "bond-missing-second"
  | "teen-count-total"
  | "teen-add-ten"
  | "teen-missing-ones"
  | "teen-identify-number";

interface AnswerChoice {
  value: number;
  label: string;
}

interface GameQuestion {
  id: string;
  level: LevelId;
  skill: QuestionSkill;
  animal: AnimalType;
  prompt: string;
  equation?: {
    left: string;
    right?: string;
  };
  startingQuantity?: number;
  targetQuantity?: number;
  looseQuantity?: number;
  expectedAnswer: number;
  answerChoices: AnswerChoice[];
  visualMode:
    | "ten-frame"
    | "full-ten-plus-ones"
    | "equation-only";
}
```

---

## 13. Question generation examples

### Level 1

```ts
{
  id: "q-001",
  level: 1,
  skill: "bond-missing-second",
  animal: "penguin",
  prompt: "How many more penguins make 10?",
  equation: {
    left: "7 + ?",
    right: "10"
  },
  startingQuantity: 7,
  targetQuantity: 10,
  expectedAnswer: 3,
  answerChoices: [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7" },
    { value: 8, label: "8" },
    { value: 9, label: "9" }
  ],
  visualMode: "ten-frame"
}
```

### Level 2

```ts
{
  id: "q-002",
  level: 2,
  skill: "teen-add-ten",
  animal: "turtle",
  prompt: "How many turtles are there altogether?",
  equation: {
    left: "10 + 6",
    right: "?"
  },
  startingQuantity: 10,
  looseQuantity: 6,
  expectedAnswer: 16,
  answerChoices: [
    { value: 11, label: "11" },
    { value: 12, label: "12" },
    { value: 13, label: "13" },
    { value: 14, label: "14" },
    { value: 15, label: "15" },
    { value: 16, label: "16" },
    { value: 17, label: "17" },
    { value: 18, label: "18" },
    { value: 19, label: "19" }
  ],
  visualMode: "full-ten-plus-ones"
}
```

---

## 14. Visual and interaction requirements

### General

- Use large text
- Use large touch targets
- Maintain high contrast
- Avoid unnecessary menus
- Avoid distracting background animation
- Avoid flashing effects
- Do not use red as the primary incorrect-answer feedback
- Do not punish errors
- Allow time to think

### Ten-frame

The ten-frame should:

- Always contain ten fixed positions
- Use two rows of five
- Keep filled and empty positions clearly distinguishable
- Have an accessible text equivalent

Example accessible label:

```text
A ten-frame with seven penguins and three empty spaces.
```

### Animal counters

Animal counters should:

- Be visually consistent in size
- Not overlap
- Remain identifiable at tablet size
- Include accessible labels
- Prefer simple illustrations or emoji in MVP

---

## 15. Audio

Audio, sound effects, mute controls, and spoken prompts are out of scope for the first playable MVP. The settings schema may be extended later without changing learning-history data.

---

## 16. Acceptance criteria

### General

- The game runs entirely in the browser.
- It works without a backend.
- Progress persists after refreshing the page.
- The game presents ten-question sessions.
- Both levels are always unlocked and each session remains within the selected level.
- The MVP stores progress for one learner per browser/device.
- Each question randomly uses turtles, whales, tigers, cats, dogs, or penguins.
- The same animal does not appear more than twice in succession.
- The app is usable with both mouse and touch.
- The project uses Vite, React, and TypeScript.
- shadcn/ui is used for general interface controls and dialogs.
- Emoji are used for the initial animal artwork behind a replaceable rendering layer.
- Animal and number names are always shown in English and te reo Māori.
- A persisted setting controls which language is shown first and emphasised; English is the initial default.
- General interface, navigation, feedback, Parent view, and accessibility instructions remain English.
- Progress is stored as one versioned JSON blob in `localStorage`.
- Progress can be exported to a JSON file.
- Resetting progress requires confirmation and preserves device settings.
- An interrupted session resumes at the same question and state.

### Level 1

- Generates complete number bonds to 10.
- Generates missing-addend questions to 10.
- Displays quantities in a ten-frame.
- Incorrect answers visually demonstrate the resulting total.
- The child must eventually provide the correct answer before continuing.
- Performance is recorded separately for each ordered number bond and question format.

### Level 2

- Represents teen numbers as one complete ten plus loose ones.
- Generates `10 + n = ?` questions.
- Generates `10 + ? = teen number` questions.
- Shows a visual explanation after an incorrect answer.
- Performance is recorded separately for each teen number and question type.

### Parent view

- Displays attempts and accuracy.
- Displays hint usage.
- Displays response time.
- Displays skill-specific performance.
- Allows progress to be exported as JSON.
- Allows all locally stored progress to be reset.

---

## 17. Explicitly out of scope

Do not include these in the first MVP:

- User accounts
- Online multiplayer
- Leaderboards
- Advertising
- Purchases
- Backend database
- Teacher classroom management
- Complex avatars
- Open-ended world exploration
- Timed pressure
- Bridging through ten
- Subtraction
- Questions above 20
- Artificial intelligence question generation
- Missing-first-addend and matching-bond Level 1 questions
- Drag-and-drop number construction
- Custom animal illustrations
- Audio and spoken prompts
- Progress import

---

## 18. Later Level 3 direction

The next level should teach bridging through ten.

Example:

```text
6 + 9
```

Transform visually into:

```text
6 + 4 + 5
10 + 5
15
```

A suitable interaction would let the child move four animals from the group of nine into the partially completed ten-frame.

Missing-addend questions such as:

```text
6 + ? = 15
```

should only be introduced after:

- Bonds to 10 are reasonably fluent
- Teen numbers are understood as `10 + ones`
- The child can visually bridge through 10

The MVP should retain an extensible skill model so this third level can be added without rewriting the underlying progress system.
