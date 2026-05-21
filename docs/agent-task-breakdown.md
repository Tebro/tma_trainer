# Agent Task Breakdown

This document converts the product plan and roadmap into implementation tasks that can be assigned to separate developers or AI agents. Each task has an expected owner boundary, dependencies, deliverables, and acceptance criteria.

Use this as the working backlog once implementation starts. The milestone roadmap explains sequence at a product level; this file explains how to split the work safely.

## Assignment Rules

- Give each assignee one task ID at a time unless the tasks share the same file ownership.
- Tell each assignee which files or directories they own before work starts.
- Avoid parallel edits to shared schemas, store shape, route definitions, and package configuration.
- Tasks that change contracts must update tests and any example content in the same assignment.
- UI tasks may use mock data until the simulation or content task they depend on is complete.
- Content tasks should avoid changing app code unless their task explicitly includes schema work.
- Every task should finish with a short implementation note, changed files list, and verification result.

## Shared Definition Of Done

A task is complete when:

- The feature or document change matches its acceptance criteria.
- Relevant tests, type checks, lint checks, or manual verification steps pass.
- New behavior is covered by a focused test when practical.
- Public types, content schemas, and README references are updated if they changed.
- The work avoids real-world operational doctrine and remains framed as game/simulation training.

## Suggested Ownership Areas

These areas reduce merge conflicts when multiple agents work in parallel.

- App shell and routing: `src/app/`, top-level config files.
- Shared UI components: `src/components/`.
- Simulation core: `src/simulation/`.
- Scoring logic: `src/scoring/`.
- Lesson engine: `src/lessons/`.
- Persistence: `src/storage/`.
- Content data: `content/lessons/`, `content/scenarios/`.
- Styles and layout system: `src/styles/`.
- Tests: matching directories under `tests/` or colocated test files.
- Planning docs: `docs/`.

## Dependency Map

Critical first tasks:

- `TMA-000` must happen before most implementation tasks.
- `TMA-001` should happen early so later agents can verify work consistently.
- `TMA-002` should happen before lesson, drill, scenario editor, and content tasks.
- `TMA-010` and `TMA-011` should happen before observation, scoring, and playback tasks.

Safe early parallel work after repository setup:

- Simulation utilities, content schema, visual design system, and lesson copy can proceed in parallel.
- UI shell can proceed with mock scenario data while simulation tasks continue.
- Unit tests for geometry can proceed independently from browser workflow tests.

Integration-heavy tasks:

- `TMA-023`, `TMA-024`, `TMA-031`, `TMA-040`, `TMA-052`, and `TMA-062` should be assigned after their dependencies are complete.

## Work Packages

### TMA-000: Scaffold App Shell

Owner type: frontend foundation developer.

Goal: create the runnable app foundation.

Dependencies: none.

Primary ownership:

- `package.json`
- build tool configuration
- `src/app/`
- `src/main.*` or equivalent entrypoint
- root app HTML if applicable

Deliverables:

- Chosen frontend stack installed and runnable.
- Root app route or workspace screen renders.
- Basic project scripts for development and build.
- Minimal folder structure matching [Technical Design](technical-design.md).

Acceptance criteria:

- `npm install` or the chosen package manager install works.
- Dev server starts.
- Production build completes.
- The first screen is an app workspace shell, not a marketing page.

### TMA-001: Verification Tooling

Owner type: tooling developer.

Goal: make verification consistent for all later agents.

Dependencies: `TMA-000`.

Primary ownership:

- test runner config
- linter and formatter config
- optional local verification script
- initial smoke test files

Deliverables:

- Unit test command.
- Lint or format check command.
- Browser smoke test command if the stack supports it.
- Documentation of verification commands in the README.

Acceptance criteria:

- A clean checkout can run the verification commands.
- At least one smoke test proves the app renders.
- Later tasks can name the exact command they ran.

### TMA-002: Scenario And Lesson Schemas

Owner type: data contract developer.

Goal: define stable content contracts before feature teams create content or editors.

Dependencies: `TMA-000` preferred, but can be drafted before app code exists.

Primary ownership:

- `src/lessons/schema.*`
- `src/simulation/scenarioTypes.*`
- `content/lessons/`
- `content/scenarios/`
- schema tests

Deliverables:

- Typed scenario model.
- Typed lesson model.
- Validation functions or schema definitions.
- One placeholder scenario and one placeholder lesson.

Acceptance criteria:

- Valid example content passes validation.
- Invalid example content produces useful errors.
- The schema includes ownship, contacts, sensor settings, tasks, hints, and debrief rules.

### TMA-010: Geometry Utilities

Owner type: simulation developer.

Goal: implement reliable 2D math for TMA calculations.

Dependencies: `TMA-000` for test setup, or `TMA-001` if verification is already ready.

Primary ownership:

- `src/simulation/geometry.*`
- geometry tests

Deliverables:

- Vector operations.
- Course and bearing conversion helpers.
- Angle normalization and shortest-angle difference.
- Unit conversion helpers if needed.

Acceptance criteria:

- Tests cover all quadrants.
- Tests cover 0/360 wrap-around.
- Functions are deterministic and side-effect free.

### TMA-011: Track Propagation

Owner type: simulation developer.

Goal: advance ownship and contact positions over simulated time.

Dependencies: `TMA-010`.

Primary ownership:

- `src/simulation/tracks.*`
- track propagation tests

Deliverables:

- Ownship propagation by course, speed, and elapsed time.
- Contact propagation by course, speed, and elapsed time.
- Scheduled course/speed maneuver support.

Acceptance criteria:

- Constant course/speed tracks match expected positions.
- Maneuver schedules apply at the correct simulated time.
- No UI code depends on hidden global time state.

### TMA-012: Observation Generator

Owner type: simulation developer.

Goal: generate game-like sensor observations from truth tracks.

Dependencies: `TMA-010`, `TMA-011`, `TMA-002`.

Primary ownership:

- `src/simulation/observations.*`
- observation tests

Deliverables:

- Bearing observations with configurable noise.
- Signal strength abstraction.
- Update interval handling.
- Seeded randomness support.

Acceptance criteria:

- Same seed and scenario produce the same observation sequence.
- Bearing noise stays within configured bounds.
- Observation timestamps align with scenario playback time.

### TMA-013: Scenario Playback Clock

Owner type: state/simulation integration developer.

Goal: coordinate scenario time, playback controls, and derived observations.

Dependencies: `TMA-011`, `TMA-012`.

Primary ownership:

- `src/simulation/playback.*`
- scenario runtime state tests

Deliverables:

- Pause, play, step, and speed controls in domain logic.
- Current truth state lookup by timestamp.
- Current observation lookup by timestamp.

Acceptance criteria:

- Playback can run headlessly without UI.
- Stepping forward is deterministic.
- Rewinding or resetting restores expected state.

### TMA-014: Estimate Scoring

Owner type: scoring developer.

Goal: compare user estimates against truth and generate score components.

Dependencies: `TMA-010`, `TMA-011`, `TMA-002`.

Primary ownership:

- `src/scoring/estimateScoring.*`
- scoring tests

Deliverables:

- Range, course, speed, and classification error scoring.
- Confidence calibration scoring.
- Score summary model for debriefs.

Acceptance criteria:

- Tests cover angle wrap-around in course error.
- Missing estimates produce clear partial scores.
- Scoring is deterministic and independent of UI state.

### TMA-020: Tactical Plot Component

Owner type: visualization developer.

Goal: render the main 2D tactical plot.

Dependencies: `TMA-000`; can use mock data until `TMA-013` is ready.

Primary ownership:

- `src/components/TacticalPlot.*`
- plot styles
- plot interaction tests if available

Deliverables:

- Ownship marker.
- Bearing history lines.
- User mark overlay placeholders.
- Timeline cursor rendering.

Acceptance criteria:

- Plot has stable dimensions and responsive constraints.
- Bearing labels and contact markers do not overlap core controls.
- Component works with mock data and real playback data.

### TMA-021: Contact And Sonar Panel

Owner type: frontend feature developer.

Goal: show current contact observations and simplified sonar cues.

Dependencies: `TMA-000`; can use mock observations until `TMA-012` is ready.

Primary ownership:

- `src/components/ContactPanel.*`
- `src/components/SonarPanel.*`
- related styles

Deliverables:

- Contact list with bearing, signal strength, confidence, and category hint.
- Selected contact details.
- Empty, ambiguous, and stale-contact states.

Acceptance criteria:

- The panel can display multiple contacts without losing contact IDs.
- Stale observations are visually distinct.
- Text remains legible at desktop and tablet widths.

### TMA-022: Playback Controls And App State

Owner type: frontend state developer.

Goal: connect UI controls to scenario playback state.

Dependencies: `TMA-013`.

Primary ownership:

- `src/app/` state modules
- `src/components/PlaybackControls.*`

Deliverables:

- Play, pause, step, reset, and speed controls.
- Current scenario time displayed consistently.
- App state bridge from playback runtime to UI components.

Acceptance criteria:

- Controls update plot and contact panel from the same timestamp.
- Reset returns to scenario start.
- Playback does not continue after leaving the workspace.

### TMA-023: Estimate Submission Flow

Owner type: frontend feature developer.

Goal: let users submit estimates during a lesson or drill.

Dependencies: `TMA-014`, `TMA-022`.

Primary ownership:

- `src/components/EstimateForm.*`
- estimate state modules
- form tests

Deliverables:

- Range, course, speed, classification, and confidence inputs.
- Validation and units labels.
- Submission history for the current attempt.

Acceptance criteria:

- Invalid estimates are rejected with clear inline errors.
- Valid estimates are timestamped.
- Submitted estimates can be scored later by debrief logic.

### TMA-024: Debrief View

Owner type: frontend feature developer.

Goal: explain what happened after a lesson or drill.

Dependencies: `TMA-014`, `TMA-020`, `TMA-023`.

Primary ownership:

- `src/components/DebriefView.*`
- debrief route or overlay
- debrief tests

Deliverables:

- Truth reveal on plot.
- Score breakdown.
- Estimate error over time.
- Plain-language feedback messages.

Acceptance criteria:

- Debrief compares user estimates against truth at matching timestamps.
- Users can distinguish truth, observations, and their submitted estimates.
- Feedback remains framed as game/simulation learning.

### TMA-030: Lesson Content Drafts

Owner type: curriculum/content developer.

Goal: write the first guided lesson content.

Dependencies: `TMA-002`.

Primary ownership:

- `content/lessons/`
- lesson copy tests or validation fixtures

Deliverables:

- Bearing-only ambiguity lesson.
- Bearing rate lesson.
- Ownship maneuvering lesson.
- Hints, checks, and debrief guidance for each.

Acceptance criteria:

- All lessons pass schema validation.
- Each lesson teaches one primary concept.
- Content avoids real-world operational procedure claims.

### TMA-031: Lesson Engine

Owner type: frontend/domain integration developer.

Goal: run lesson tasks, hints, checks, and completion state.

Dependencies: `TMA-002`, `TMA-022`, `TMA-030`.

Primary ownership:

- `src/lessons/`
- lesson runtime tests
- lesson UI integration points

Deliverables:

- Lesson loader.
- Current task state.
- Hint reveal behavior.
- Completion tracking.

Acceptance criteria:

- User can complete one lesson end to end.
- Lesson progress persists through refresh if persistence is ready.
- Lesson tasks can depend on playback time or submitted estimates.

### TMA-032: Progress Persistence

Owner type: storage developer.

Goal: save user progress and settings locally.

Dependencies: `TMA-002`; `TMA-031` preferred.

Primary ownership:

- `src/storage/`
- persistence tests

Deliverables:

- Completed lessons storage.
- User settings storage.
- Attempt summary storage.
- Migration/version field.

Acceptance criteria:

- Progress survives page refresh.
- Corrupt or outdated data fails gracefully.
- Storage APIs are isolated from UI components.

### TMA-040: Drill Generator

Owner type: simulation/content developer.

Goal: create repeatable randomized drills.

Dependencies: `TMA-002`, `TMA-011`, `TMA-012`, `TMA-014`.

Primary ownership:

- `src/simulation/drillGenerator.*`
- `content/scenarios/` drill templates
- generator tests

Deliverables:

- Seeded randomization.
- Difficulty settings.
- Bounds validation.
- Five MVP drill templates.

Acceptance criteria:

- Same seed and difficulty produce the same drill.
- Generated drills validate against the scenario schema.
- Randomized values remain inside safe gameplay bounds.

### TMA-041: Drill Selection UI

Owner type: frontend feature developer.

Goal: let users choose and start drills.

Dependencies: `TMA-040`, `TMA-022`.

Primary ownership:

- `src/components/DrillSelector.*`
- relevant app route/state

Deliverables:

- Drill template selection.
- Difficulty controls.
- Seed entry or regenerate control.
- Start drill action.

Acceptance criteria:

- User can start any MVP drill.
- Selected difficulty and seed are visible before launch.
- Drill launch initializes playback and estimate state cleanly.

### TMA-042: Attempt History

Owner type: storage/frontend integration developer.

Goal: record and display practice attempts.

Dependencies: `TMA-014`, `TMA-024`, `TMA-032`.

Primary ownership:

- `src/storage/attempts.*`
- attempt history UI

Deliverables:

- Attempt summary records.
- Best score tracking.
- Simple attempt archive view.

Acceptance criteria:

- Completing a drill records an attempt.
- Best score updates only when appropriate.
- Attempt records include scenario ID, seed, difficulty, timestamp, and score summary.

### TMA-050: Sonar Cue Model

Owner type: simulation/content developer.

Goal: add simplified game-like sonar classification cues.

Dependencies: `TMA-002`, `TMA-012`.

Primary ownership:

- `src/simulation/sonarCues.*`
- sonar cue tests
- scenario content fields if needed

Deliverables:

- Fictional signature categories.
- Ambiguous cue generation.
- Contact confidence model.
- Transient event cue support.

Acceptance criteria:

- Cues are deterministic with a fixed seed.
- Ambiguity settings affect cue clarity.
- No real vessel signature data is introduced.

### TMA-051: Classification UI

Owner type: frontend feature developer.

Goal: let users classify contacts and express confidence.

Dependencies: `TMA-021`, `TMA-050`.

Primary ownership:

- classification controls in contact or estimate components
- related styles and tests

Deliverables:

- Category selection.
- Confidence control.
- Per-contact classification state.
- Clear unknown or uncertain state.

Acceptance criteria:

- Users can classify each contact independently.
- Confidence is stored with the classification.
- UI does not imply that fictional categories are real-world databases.

### TMA-052: Classification Scoring Drill

Owner type: scoring/content integration developer.

Goal: score classification and confidence in a two-contact drill.

Dependencies: `TMA-014`, `TMA-040`, `TMA-050`, `TMA-051`.

Primary ownership:

- `src/scoring/classificationScoring.*`
- classification drill content
- scoring tests

Deliverables:

- Classification accuracy scoring.
- Overconfidence penalty.
- Two-contact sorting drill.
- Debrief feedback messages.

Acceptance criteria:

- Correct low-confidence and high-confidence answers score differently.
- Incorrect high-confidence answers are penalized.
- Debrief identifies false positives and ambiguous cues.

### TMA-060: Scenario Editor Data Model

Owner type: data contract developer.

Goal: define editable scenario draft state and validation.

Dependencies: `TMA-002`, `TMA-040`.

Primary ownership:

- `src/simulation/scenarioEditorModel.*`
- editor validation tests

Deliverables:

- Draft scenario model.
- Validation errors mapped to editable fields.
- Conversion from draft to runnable scenario.

Acceptance criteria:

- Invalid drafts report field-specific errors.
- Valid drafts convert to schema-compliant scenarios.
- Editor data model remains independent from UI widgets.

### TMA-061: Scenario Editor UI

Owner type: frontend feature developer.

Goal: let users create and preview scenarios.

Dependencies: `TMA-060`, `TMA-022`.

Primary ownership:

- `src/components/ScenarioEditor.*`
- editor route/state

Deliverables:

- Ownship editor.
- Contact editor.
- Sensor settings editor.
- Preview playback action.

Acceptance criteria:

- User can create a valid one-contact scenario.
- Validation errors appear near the relevant controls.
- Preview uses the same playback path as normal drills.

### TMA-062: Scenario Import And Export

Owner type: frontend/storage integration developer.

Goal: support sharing scenarios as JSON.

Dependencies: `TMA-060`, `TMA-061`.

Primary ownership:

- scenario import/export utilities
- editor import/export UI
- validation tests

Deliverables:

- Export current scenario draft as JSON.
- Import JSON into editor draft.
- Validation before running imported scenarios.

Acceptance criteria:

- Exported scenarios can be re-imported.
- Invalid imports do not overwrite the current draft.
- Shared scenarios do not require external assets.

### TMA-070: Visual Design System

Owner type: UI systems developer.

Goal: establish reusable layout, colors, controls, and responsive behavior.

Dependencies: `TMA-000`.

Primary ownership:

- `src/styles/`
- shared control components
- visual smoke tests if available

Deliverables:

- App layout grid for trainer workspace.
- Button, input, select, tab, panel, and tooltip styles.
- Responsive constraints for plot, panels, and bottom controls.

Acceptance criteria:

- Workspace remains usable at common desktop and tablet widths.
- Controls have stable dimensions and do not shift during playback.
- Palette is functional and not dominated by one hue family.

### TMA-071: End-To-End Workflow Tests

Owner type: QA automation developer.

Goal: protect the main user flows against regressions.

Dependencies: `TMA-022`, `TMA-023`, `TMA-024`; more coverage after lessons and drills are ready.

Primary ownership:

- browser test config
- end-to-end test files

Deliverables:

- Lesson smoke workflow.
- Drill smoke workflow.
- Debrief smoke workflow.
- Optional screenshot checks for tactical plot rendering.

Acceptance criteria:

- Tests run from a documented command.
- Failures identify the broken workflow clearly.
- Plot render checks catch blank or missing tactical plot output.

## Recommended Parallel Batches

### Batch A: Foundation

- `TMA-000`
- `TMA-001`
- `TMA-002`
- `TMA-070`

`TMA-000` is the main blocker. `TMA-002` and `TMA-070` can begin as draft work once the stack is known.

### Batch B: Core Domain And Mock UI

- `TMA-010`
- `TMA-011`
- `TMA-012`
- `TMA-014`
- `TMA-020`
- `TMA-021`

Simulation work and UI work can proceed in parallel if UI tasks use mock data with the agreed schema.

### Batch C: First End-To-End Trainer Loop

- `TMA-013`
- `TMA-022`
- `TMA-023`
- `TMA-024`
- `TMA-071`

This batch integrates playback, estimate submission, and debriefs into the first complete user flow.

### Batch D: Lessons And Persistence

- `TMA-030`
- `TMA-031`
- `TMA-032`

Content and lesson runtime can be split if the schema is stable.

### Batch E: Replayable Practice

- `TMA-040`
- `TMA-041`
- `TMA-042`

This batch turns the trainer from a guided demo into a reusable practice tool.

### Batch F: Classification And Scenario Authoring

- `TMA-050`
- `TMA-051`
- `TMA-052`
- `TMA-060`
- `TMA-061`
- `TMA-062`

Classification and scenario editor work can run in parallel after the core scenario schema is stable.

## Copyable Assignment Prompt

Use this prompt shape when assigning a task to another developer or AI agent:

```text
You own task <TASK-ID>: <TASK TITLE>.

Goal:
<one-paragraph goal from docs/agent-task-breakdown.md>

Dependencies already completed:
<list completed task IDs or say "none">

You own these files/directories:
<explicit ownership list>

Do not edit these files/directories:
<explicit exclusions, especially files owned by other active agents>

Deliverables:
<copy deliverables>

Acceptance criteria:
<copy acceptance criteria>

Verification:
Run the relevant project checks and report the exact commands and results.

Handoff:
Finish with changed files, key decisions, remaining risks, and any follow-up task IDs.
```
