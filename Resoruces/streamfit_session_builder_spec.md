
# Streamfit – Single-Session Workout Builder Engine + Simple Web App Spec

## 1. Goal

Build a simple web app where:

- on the **left side** the user provides a few inputs
- on the **right side** the app generates **one single workout session**
- the workout is assembled from a tagged video library
- the workout is **not** a multi-day plan
- the generated result should be logical, safe, goal-oriented, and easy to follow for non-expert users

This spec is focused on:
1. the **session-builder decision engine**
2. the **input/output logic**
3. the **simple web app behavior**
4. the **video-selection rules**
5. the **prompt-free / deterministic rule engine approach** that Codex can implement fast

---

## 2. Core Principle

The app should not simply list random exercises.

It should:
1. understand the user's current need
2. pick a suitable **session template**
3. filter the video pool
4. order the chosen videos in a professionally logical sequence
5. produce a complete workout with:
   - warm-up
   - activation (optional)
   - main block
   - accessory/core/finisher
   - cooldown

---

## 3. Important Library Scope Rule

The uploaded library is broader than strict “home workout only” content.

Therefore the app must only use videos that pass a **home-safe usable content filter**.

### Required production filters
Each video should ideally have or infer these flags:

- `home_safe` = true/false
- `requires_large_space` = true/false
- `requires_gym_setup` = true/false
- `requires_partner` = true/false
- `advanced_risk` = true/false

### Minimum rule
Only videos may be used in the generated session if:

- `home_safe = true`
- `requires_partner = false`
- `requires_gym_setup = false`

Optional stricter rule for MVP:
- ignore videos with barbell, ring, rope, BOSU, weighted vest, large-box dependency, or any unclear environment requirement
- prioritize:
  - bodyweight
  - dumbbell
  - kettlebell
  - band
  - TRX
  - bench_or_box only if explicitly allowed by user

---

## 4. User Inputs – Left Panel

## 4.1 Required Inputs

### 1. Goal
Enum:
- `general_fitness`
- `fat_burn`
- `strength`
- `tone`
- `mobility`
- `core`
- `low_impact`
- `conditioning`

### 2. Workout length
Enum:
- `30`
- `45`
- `60`

### 3. Level
Enum:
- `beginner`
- `lower_intermediate`
- `intermediate`
- `advanced`

### 4. Available equipment
Multi-select:
- `bodyweight_only`
- `dumbbell`
- `kettlebell`
- `band`
- `trx`
- `bench_or_box`
- `mixed_light_equipment`

### 5. Impact tolerance
Enum:
- `low`
- `medium`
- `high`

### 6. Sensitive areas / restrictions
Multi-select:
- `none`
- `knee_sensitive`
- `lower_back_sensitive`
- `shoulder_sensitive`
- `wrist_sensitive`

---

## 4.2 Optional Inputs

### 7. Focus area
Enum:
- `full_body`
- `lower_body`
- `upper_body`
- `core`

### 8. Today’s energy
Enum:
- `low`
- `medium`
- `high`

### 9. Style preference
Enum:
- `steady`
- `interval`
- `strength`
- `flow`

### 10. Use simple mode
Boolean:
- `true`
- `false`

If `true`:
- fewer exercises
- less complexity
- fewer transitions
- fewer equipment changes

---

## 5. Right Panel Output

The app should show:

### A. Session summary
- title
- total duration
- primary goal
- equipment used
- intensity estimate
- impact estimate

### B. Block structure
Example:
- Warm-up – 5 min
- Main block – 18 min
- Core finisher – 4 min
- Cooldown – 3 min

### C. Ordered exercise list
For each item:
- order number
- exercise / video title
- duration or reps
- rounds
- rest
- notes / coaching hint
- reason tag (optional, admin/debug mode)

### D. Workout notes
- “Low impact session”
- “Knee-sensitive friendly”
- “Beginner simplified session”
- “Uses kettlebell + bodyweight”

### E. Regenerate button
Generate another session with same inputs but slightly different exercise choices

---

## 6. Video Data Model

Each video record should have these fields.

## 6.1 Basic
- `video_id`
- `title`
- `video_url` or internal reference
- `duration_seconds` (if available)
- `thumbnail_url` (optional)

## 6.2 Core classification
- `equipment_type`
- `primary_pattern`
- `secondary_pattern`
- `body_region`
- `muscle_focus`
- `impact_level`
- `complexity_level`
- `intensity_estimate`
- `position_type`
- `unilateral_flag`
- `beginner_friendly`
- `session_role_fit`

## 6.3 Safety / usability flags
- `home_safe`
- `requires_large_space`
- `requires_partner`
- `requires_gym_setup`
- `advanced_risk`
- `contraindication_flags`

## 6.4 Optional future fields
- `coach_style`
- `pace_type`
- `enjoyment_tags`
- `language`
- `audio_instruction_quality`

---

## 7. Recommended Enums

## 7.1 equipment_type
- `bodyweight`
- `dumbbell`
- `kettlebell`
- `band`
- `trx`
- `bench_or_box`
- `mixed`
- `other`

## 7.2 primary_pattern
- `squat`
- `lunge`
- `hinge`
- `push`
- `pull`
- `core_flexion`
- `core_anti_extension`
- `core_rotation`
- `mobility`
- `cardio_locomotion`
- `balance_stability`
- `mixed_other`

## 7.3 body_region
- `lower_body`
- `upper_body`
- `core`
- `full_body`

## 7.4 impact_level
- `low`
- `medium`
- `high`

## 7.5 complexity_level
- `basic`
- `moderate`
- `complex`

## 7.6 intensity_estimate
- `low`
- `low_medium`
- `medium`
- `medium_high`
- `high`

## 7.7 position_type
- `standing`
- `floor`
- `mixed`

## 7.8 session_role_fit
Multi-value enum:
- `warmup`
- `activation`
- `main`
- `accessory`
- `finisher`
- `cooldown`

---

## 8. Title-Based Auto-Tagging Rules

The library can be auto-tagged from titles, but some fields must later be refined manually or by AI QA.

## 8.1 Equipment detection
Keyword rules:

- contains `trx` → `equipment_type = trx`
- contains `kettlebell` or `kb` → `kettlebell`
- contains `dumbbell`, `dumbell`, `db` → `dumbbell`
- contains `band`, `resistance band`, `mini band` → `band`
- contains `bench`, `box`, `step up` → `bench_or_box`
- else default → `bodyweight`

## 8.2 Pattern detection
- `squat`, `thruster` → squat
- `lunge`, `split squat`, `step up`, `curtsy` → lunge
- `deadlift`, `rdl`, `hip hinge`, `swing`, `good morning`, `bridge`, `thrust` → hinge
- `push up`, `press`, `dip`, `shoulder press`, `floor press` → push
- `row`, `pull`, `reverse fly`, `pull apart` → pull
- `plank`, `sit up`, `crunch`, `dead bug`, `hollow`, `twist`, `rotation`, `russian twist` → core
- `jump`, `hop`, `burpee`, `run`, `skater`, `mountain climber`, `high knees` → cardio_locomotion
- `mobility`, `stretch`, `openers`, `flow`, `release` → mobility

## 8.3 Impact detection
- `jump`, `hop`, `burpee`, `skater jump`, `tuck jump` → high
- `march`, `bridge`, `plank`, `wall sit`, `slow squat` → low
- default strength patterns without jump → low or medium

## 8.4 Complexity detection
- `single leg`, `single arm`, `rotational`, `snatch`, `clean`, `turkish get up`, `pistol`, `windmill` → moderate/complex
- `squat`, `bridge`, `row`, `press`, `dead bug`, `wall sit` → basic

## 8.5 Session role fit
- warm-up candidates:
  - mobility
  - openers
  - marching
  - easy dynamic prep
- activation candidates:
  - bridge
  - dead bug
  - bird dog
  - scap activation
- main candidates:
  - squat
  - lunge
  - row
  - push up
  - hinge
  - swing
- accessory candidates:
  - core
  - unilateral isolation
  - stability
- finisher candidates:
  - simple cardio locomotion
  - jump / pulse repeat
  - short interval-friendly strength
- cooldown candidates:
  - stretch
  - breathing
  - mobility flow

---

## 9. Fields That Must Be QA’d After Auto-Tagging

These fields should not be trusted 100% from title only:
- `complexity_level`
- `intensity_estimate`
- `session_role_fit`
- `beginner_friendly`
- `contraindication_flags`
- `home_safe`

For MVP, Codex can start with heuristics + manual review table.

---

## 10. Single-Session Builder Engine – Main Logic

This is the main deterministic engine.

## STEP 1 – Build Candidate Pool
Start from all videos.

Remove anything that fails:
- equipment mismatch
- home safety mismatch
- restriction conflict
- impact above user tolerance
- complexity too high for level
- unusable session role
- unclear / unsupported content type

Pseudo logic:

```ts
candidateVideos = videos
  .filter(matchesEquipment)
  .filter(matchesHomeSafety)
  .filter(matchesRestrictions)
  .filter(matchesImpactTolerance)
  .filter(matchesLevel)
  .filter(matchesGoalBasicRelevance)
```

---

## STEP 2 – Select Session Template

### If goal = strength or tone
Template:
- warm-up
- activation
- main strength block
- accessory/core
- cooldown

### If goal = fat_burn or conditioning
Template:
- warm-up
- progressive cardio-strength main block
- optional finisher
- cooldown

### If goal = mobility
Template:
- warm-up mobility
- mobility/control main block
- light core/stability
- cooldown

### If goal = core
Template:
- warm-up
- full-body support block
- core main block
- cooldown

### If goal = low_impact
Template:
- low-impact warm-up
- controlled full-body main block
- optional light accessory
- cooldown

### If goal = general_fitness
Template:
- warm-up
- balanced full-body main block
- accessory/core
- cooldown

---

## STEP 3 – Determine Time Budget per Block

### 30 min template
- warm-up: 4–5 min
- activation: 2–3 min optional
- main: 16–18 min
- accessory/core: 4–5 min
- cooldown: 2–3 min

### 45 min template
- warm-up: 5–7 min
- activation: 3–4 min optional
- main: 22–26 min
- accessory/core: 6–8 min
- cooldown: 3–4 min

### 60 min template
- warm-up: 7–10 min
- activation: 3–5 min optional
- main: 28–35 min
- accessory/core or finisher: 8–10 min
- cooldown: 4–5 min

Rule:
If beginner + 30 min:
- activation may merge into warm-up
- only one main block
- max one short accessory/core block

---

## STEP 4 – Select Warm-Up Exercises

Warm-up candidates must satisfy:
- low intensity
- low or medium-low impact
- low complexity
- session_role_fit includes warmup or activation
- no heavy fatigue

Warm-up composition:
- 1 mobility prep
- 1 lower-body pattern prep
- 1 upper-body or trunk prep
- 1 easy pulse-raising movement

Do not:
- start with jump-heavy content
- start with fatigue-heavy core
- start with technically complex kettlebell drills

---

## STEP 5 – Select Activation Exercises (Optional)

Use activation if:
- strength/tone session
- lower-body emphasis
- upper-body control emphasis
- session length >= 45
- user level is beginner and needs pattern prep

Activation examples:
- glute bridge
- dead bug
- bird dog
- band pull
- scap retraction
- anti-rotation prep

Rules:
- short
- controlled
- not exhausting
- should improve main block performance

---

## STEP 6 – Build Main Block

This is the most important part.

### 6.1 Main block objective by goal

#### goal = strength
Main block priority:
- multi-joint patterns
- lower repetition / moderate rest logic
- fewer but more meaningful exercises

#### goal = tone
Main block priority:
- balanced full-body
- moderate reps / time
- moderate rest
- more continuous flow than pure strength

#### goal = fat_burn / conditioning
Main block priority:
- repeatable, lower-risk, simpler patterns
- shorter rest
- pulse-elevating structure

#### goal = general_fitness
Main block priority:
- balanced movement selection
- moderate intensity
- minimal complexity

#### goal = mobility
Main block priority:
- controlled range of motion
- flowing but not exhausting
- stability + mobility integration

#### goal = low_impact
Main block priority:
- no explosive jumping
- low joint stress
- simple controlled whole-body work

---

## 11. Main Block Ordering Rules

These are mandatory.

## RULE 1
Place the most important and technically demanding usable exercises earlier.

## RULE 2
Do not place too many locally similar heavy exercises back-to-back.

Bad beginner sequence:
- squat
- jump squat
- lunge
- split squat hold
- wall sit

Better:
- squat
- push
- hinge
- row
- core
- lunge

## RULE 3
Alternate movement families where possible.

Recommended sequence patterns:
- squat → push → hinge → pull → core
- lower → upper → lower → upper → core
- hinge → push → lunge → pull → core

## RULE 4
Do not heavily fatigue core before technically demanding compound work.

## RULE 5
High impact should not appear suddenly at the start of the main block.

## RULE 6
Finishers should contain simpler, safer repeatable movements, not the most technical ones.

## RULE 7
Minimize floor-to-stand transitions, especially for beginner users.

## RULE 8
Minimize equipment switching.

MVP target:
- bodyweight only
or
- one primary tool + bodyweight

---

## 12. Goal-Specific Exercise Weighting

The engine should score candidate videos differently by goal.

## 12.1 Strength scoring boost
Boost:
- squat
- hinge
- push
- pull
- lunge
- kettlebell strength
- dumbbell strength
Reduce:
- pure mobility
- pure cardio locomotion unless used as finisher

## 12.2 Tone scoring boost
Boost:
- full body compound
- moderate-time circuits
- unilateral strength
- controlled cardio-strength mix

## 12.3 Fat burn / conditioning boost
Boost:
- cardio_locomotion
- simple squat/lunge/push repeaters
- short-cycle circuit-friendly items
Reduce:
- highly technical low-repeat strength drills

## 12.4 Core boost
Boost:
- anti-extension
- anti-rotation
- side stability
- controlled flexion
Reduce:
- too many repeated sit-up variants only

## 12.5 Mobility boost
Boost:
- mobility
- control
- stretch-flow
- low intensity stability

---

## 13. Restriction Rules

## 13.1 knee_sensitive
Reduce or block:
- repeated jumping
- deep impact lunge jumps
- harsh landing patterns
- uncontrolled skater jumps
Prefer:
- bridge
- hinge
- supported squat
- low-impact lunge
- controlled step patterns

## 13.2 lower_back_sensitive
Reduce or block:
- high-speed hinge fatigue
- uncontrolled rotation
- poorly stabilized swings
- heavy spinal flexion patterns
Prefer:
- controlled core stability
- glute work
- anti-rotation
- supported lower-body work

## 13.3 shoulder_sensitive
Reduce or block:
- repeated overhead pressing
- unstable overhead positions
- aggressive push-up volume
Prefer:
- row
- controlled pressing
- light range shoulder prep

## 13.4 wrist_sensitive
Reduce or block:
- long plank holds
- repeated floor-loaded push patterns
Prefer:
- forearm variations
- standing core
- lower-body and supported upper-body work

---

## 14. Level Rules

## beginner
- max complexity = basic or selected moderate
- no dense transition chaos
- no high technical kettlebell sequence
- no advanced instability emphasis
- fewer exercises
- longer rest
- clearer structure

## lower_intermediate
- may include moderate complexity
- moderate transitions
- simple finisher allowed

## intermediate
- broader pattern use
- more circuit variation
- can tolerate denser structure

## advanced
- can include more complex sequence, if still home-safe and goal-relevant

---

## 15. Intensity / Work-Rest Rules

## 15.1 beginner general / strength
- 30–40 sec work
- 20–30 sec rest
- 2–3 rounds

## 15.2 beginner reps version
- 8–12 reps
- 2–3 rounds

## 15.3 moderate conditioning
- 40–45 sec work
- 15–20 sec rest
- 3 rounds

## 15.4 core hold
- 20–40 sec
- 2–3 rounds

## 15.5 30-min session simplification
- max 1 main circuit
- optional 1 short finisher OR 1 short core block
- not both unless very compact

---

## 16. Hard Exclusion Rules

A video must be excluded if:
- not home-safe
- equipment unavailable
- contradicts restriction rules
- complexity above allowed level
- impact above tolerance
- session role unsuitable
- duplicates too closely with already selected previous item in a bad way
- requires large space not available
- requires partner or special setup

---

## 17. Duplicate / Repetition Control

Within one session:
- do not use near-duplicate videos back-to-back
- do not use more than 2 highly similar pattern videos in a row
- do not repeat the same exact title
- do not build monotony into a short session

Prefer diversity across:
- movement family
- body region
- position
- equipment usage
- effort feel

---

## 18. Simple Scoring Model

Codex can implement a weighted score per candidate.

Example:

```ts
score =
  goalMatchScore * 4 +
  levelMatchScore * 3 +
  equipmentMatchScore * 3 +
  impactFitScore * 3 +
  restrictionSafetyScore * 5 +
  sessionRoleFitScore * 4 +
  varietyContributionScore * 2 +
  homeSafetyScore * 5 -
  repetitionPenalty * 3 -
  transitionPenalty * 2 -
  complexityPenalty * 4
```

Then choose best candidates per block while respecting ordering rules.

---

## 19. Session Assembly Algorithm – MVP Version

```ts
function buildWorkoutSession(userInput, videos) {
  const pool = videos
    .filter(homeSafe)
    .filter(matchesEquipment(userInput))
    .filter(matchesRestrictions(userInput))
    .filter(matchesImpact(userInput))
    .filter(matchesLevel(userInput))
    .filter(matchesGoalBasicRelevance(userInput));

  const template = selectTemplate(userInput);
  const blockBudgets = getBlockBudgets(userInput);

  const warmup = pickWarmup(pool, userInput, blockBudgets.warmup);
  const activation = pickActivation(pool, userInput, blockBudgets.activation, warmup);
  const main = pickMainBlock(pool, userInput, blockBudgets.main, [...warmup, ...activation]);
  const accessory = pickAccessory(pool, userInput, blockBudgets.accessory, [...warmup, ...activation, ...main]);
  const cooldown = pickCooldown(pool, userInput, blockBudgets.cooldown);

  const session = orderAndValidate([
    ...warmup,
    ...activation,
    ...main,
    ...accessory,
    ...cooldown
  ], userInput);

  return finalizeSession(session, userInput);
}
```

---

## 20. Ordering / Validation Pass

After selection, run final checks:

- starts with warm-up
- no bad high-impact surprise early
- no 3–4 same-region overload chain for beginners
- no heavy core fatigue before technical main work
- no weird final exercise before cooldown
- total time within target
- equipment switching minimized
- transitions acceptable
- session feels coherent

If validation fails:
- swap lowest-priority offending item
- regenerate only the broken block, not the whole session

---

## 21. Output Formatting Rules

For each workout session, output:

### Workout title
Example:
- “30-Min Beginner Low-Impact Full Body Workout”
- “45-Min Kettlebell + Bodyweight Strength Session”
- “30-Min Core + Mobility Reset”

### Block list
Each block includes:
- block name
- duration
- round structure
- exercises in order

### Exercise line item
- video title
- work format
- rest
- rounds
- note

Example:
- Goblet Squat – 40 sec work / 20 sec rest – 3 rounds
- Dead Bug – 30 sec / 15 sec – 2 rounds

### Session footer
- estimated intensity
- estimated impact
- equipment used
- safety notes

---

## 22. Simple Web App Layout

## Left side
User input form:
- goal
- duration
- level
- equipment
- impact tolerance
- restrictions
- focus area
- energy
- style
- generate button

## Right side
Workout result:
- title
- summary tags
- block cards
- ordered exercise list
- regenerate button
- optional “why this plan?” explanation
- optional “admin debug” mode to show scoring and filters

---

## 23. Recommended MVP UX

Keep it extremely simple.

### On first version:
- one-screen app
- no login needed
- local mock data or JSON library
- one “Generate workout” button
- one “Generate another variation” button

### Nice-to-have:
- copy as text
- export as PDF later
- save session later
- watch video link later

---

## 24. Recommended Technical Implementation for MVP

Codex can build this as:

- Next.js frontend
- simple JSON or local DB source for videos
- deterministic TypeScript rule engine
- no AI needed for first session assembly
- optional later AI explanation layer

### Suggested modules
- `videoTaxonomy.ts`
- `filterEngine.ts`
- `scoringEngine.ts`
- `sessionTemplates.ts`
- `orderingRules.ts`
- `sessionBuilder.ts`
- `sampleVideos.json`

---

## 25. MVP Development Order

1. Load tagged video data
2. Implement filters
3. Implement session templates
4. Implement scoring
5. Implement ordering rules
6. Render result UI
7. Add regenerate variation logic
8. Add admin/debug mode

---

## 26. Very Important MVP Constraint

Do **not** attempt to solve everything in version 1.

Version 1 should:
- work only with home-safe videos
- generate only one session
- use simple rules
- prefer safety and clarity over sophistication
- avoid weekly planning
- avoid exact weight prescription beyond simple guidance

---

## 27. Weight Guidance Rule

For MVP, do not prescribe exact kilos.

Use simple output language:
- bodyweight
- light weight
- medium weight
- challenging but controlled weight

Simple note:
“Choose a weight that feels hard by the final repetitions, but your form still stays clean.”

---

## 28. Example Output Structure

```json
{
  "title": "30-Min Beginner Low-Impact Full Body Workout",
  "summary": {
    "goal": "general_fitness",
    "duration": 30,
    "intensity": "low_medium",
    "impact": "low",
    "equipment": ["bodyweight", "dumbbell"]
  },
  "blocks": [
    {
      "name": "Warm-up",
      "duration_min": 5,
      "items": []
    },
    {
      "name": "Main Block",
      "duration_min": 18,
      "rounds": 3,
      "work_sec": 40,
      "rest_sec": 20,
      "items": []
    },
    {
      "name": "Core / Accessory",
      "duration_min": 4,
      "items": []
    },
    {
      "name": "Cooldown",
      "duration_min": 3,
      "items": []
    }
  ]
}
```

---

## 29. Final Summary

This app should behave like a simple professional trainer logic engine:

- first understand the user
- then choose a session template
- then filter the video library
- then score and select exercises
- then order them according to professional sequencing rules
- then return one coherent workout session

The engine should prioritize:
1. safety
2. simplicity
3. goal relevance
4. session coherence
5. home usability

That is enough for a very solid MVP.
