# Implementation Roadmap

## Current Implementation Status

Milestones 0 through 5 are implemented and verified. The trainer currently includes the app shell, simulation core, tactical plot, lesson library, three guided lessons, seeded drill generator, nine drill templates, sonar cue/classification support, local progress/attempt persistence, timeline scrubbing, manual drill maneuvers, and debrief visualization with layer toggles.

Current verification baseline: `pnpm verify` passes with 213 tests.

See [Current Status](current-status.md) for the detailed implemented feature list, known limitations, and recommended next work.

## Milestone 0: Repository Setup

Status: complete.

Goal: establish the project foundation.

Deliverables:

- Choose frontend stack.
- Add formatter, linter, and test runner.
- Create initial app shell.
- Add CI or a local verification script.
- Define lesson and scenario content schemas.

Exit criteria:

- App starts locally.
- Tests run locally.
- A placeholder scenario can be loaded from content data.

Agent-ready tasks:

- `TMA-000`: scaffold the app shell.
- `TMA-001`: add verification tooling.
- `TMA-002`: define scenario and lesson schemas.
- `TMA-070`: establish the visual design system.

## Milestone 1: Simulation Core

Status: complete. Also includes contact dropout windows and scenario updates for drill-time ownship maneuvers.

Goal: create deterministic geometry and observation logic.

Deliverables:

- 2D vector and angle utilities.
- Ownship and contact track propagation.
- Bearing observation generation with noise.
- Scenario playback clock.
- Estimate scoring functions.
- Unit tests for simulation and scoring.

Exit criteria:

- A scenario can run headlessly.
- Bearing history is reproducible with a fixed seed.
- Estimate error is calculated consistently.

Agent-ready tasks:

- `TMA-010`: implement geometry utilities.
- `TMA-011`: implement track propagation.
- `TMA-012`: implement observation generation.
- `TMA-013`: implement scenario playback clock.
- `TMA-014`: implement estimate scoring.

## Milestone 2: Training Workspace

Status: complete. Expanded with cursor range/bearing readout, click-to-suggest range, timeline scrubbing, live playback animation, and observation-time bearing origins.

Goal: make the core loop usable in the browser.

Deliverables:

- Tactical plot with ownship, bearing lines, and timeline cursor.
- Contact panel with current observations.
- Playback controls.
- Estimate submission form.
- Basic debrief view with truth reveal and score.

Exit criteria:

- User can complete one simple drill end to end.
- Debrief explains range, course, and speed error.
- Layout is usable on common desktop widths.

Agent-ready tasks:

- `TMA-020`: build the tactical plot component.
- `TMA-021`: build the contact and sonar panel.
- `TMA-022`: connect playback controls and app state.
- `TMA-023`: build the estimate submission flow.
- `TMA-024`: build the debrief view.
- `TMA-071`: add end-to-end workflow tests.

## Milestone 3: Guided Lessons

Status: complete for MVP content. Task gating remains a follow-up.

Goal: add structured learning content.

Deliverables:

- Lesson engine with objectives, tasks, hints, and completion state.
- Three MVP lessons:
  - Bearing-only ambiguity.
  - Bearing rate over time.
  - Ownship maneuvering.
- Inline checks before debrief reveal.
- Progress persistence.

Exit criteria:

- A new user can follow the intro path without external instructions.
- Lessons record completion.
- Lesson content is data-driven.

Agent-ready tasks:

- `TMA-030`: draft the MVP lesson content.
- `TMA-031`: implement the lesson engine.
- `TMA-032`: implement progress persistence.

## Milestone 4: Drill Generator

Status: complete and expanded beyond the original MVP template count.

Goal: make practice replayable.

Deliverables:

- Seeded scenario randomization.
- Difficulty controls.
- Five MVP drill templates.
- Additional drills for high-noise bearing-only, maneuver timing, rapid estimate, and lost-contact/reacquire practice.
- Attempt history.
- Best score tracking.

Exit criteria:

- Users can replay a drill with a new seed.
- Scores are comparable across attempts at the same difficulty.
- Randomized scenarios stay within valid bounds.

Agent-ready tasks:

- `TMA-040`: implement the drill generator.
- `TMA-041`: build the drill selection UI.
- `TMA-042`: implement attempt history.

## Milestone 5: Sonar Classification Layer

Status: complete for simplified fictional cue/classification practice.

Goal: add contact classification practice.

Deliverables:

- Simplified sonar cue model.
- Contact category hints.
- Confidence-based classification scoring.
- Two-contact sorting drill.
- Debrief notes for false positives and overconfidence.

Exit criteria:

- User can classify contacts with confidence levels.
- The app can represent ambiguous cues.
- Scoring rewards calibrated uncertainty.

Agent-ready tasks:

- `TMA-050`: implement the sonar cue model.
- `TMA-051`: build the classification UI.
- `TMA-052`: implement classification scoring and the two-contact drill.

## Milestone 6: Scenario Editor And Sharing

Status: not started.

Goal: support community-created practice.

Deliverables:

- Scenario editor for ownship, contacts, sensor settings, and tasks.
- Import/export as JSON.
- Validation errors for impossible or unsupported scenarios.
- Preview playback.

Exit criteria:

- A user can create, run, and export a scenario.
- Imported scenarios are validated before use.
- Shared scenarios do not require external assets.

Agent-ready tasks:

- `TMA-060`: define the scenario editor data model.
- `TMA-061`: build the scenario editor UI.
- `TMA-062`: implement scenario import and export.

## Parallel Implementation Model

Use [Agent Task Breakdown](agent-task-breakdown.md) as the source of truth for assigning individual tasks. The roadmap milestones describe product sequence, while the task breakdown defines file ownership, dependencies, deliverables, and acceptance criteria.

Recommended parallel batches:

- Foundation: `TMA-000`, `TMA-001`, `TMA-002`, `TMA-070`.
- Core domain and mock UI: `TMA-010`, `TMA-011`, `TMA-012`, `TMA-014`, `TMA-020`, `TMA-021`.
- First end-to-end trainer loop: `TMA-013`, `TMA-022`, `TMA-023`, `TMA-024`, `TMA-071`.
- Lessons and persistence: `TMA-030`, `TMA-031`, `TMA-032`.
- Replayable practice: `TMA-040`, `TMA-041`, `TMA-042`.
- Classification and scenario authoring: `TMA-050`, `TMA-051`, `TMA-052`, `TMA-060`, `TMA-061`, `TMA-062`.

## Risks

- TMA may become too abstract without strong visual feedback.
- A full solver can distract from teaching the player's reasoning workflow.
- Users may expect exact behavior from their preferred game.
- Overly realistic terminology can imply fidelity the product does not provide.
- Dense visualizations can become hard to use on smaller screens.

## Mitigations

- Keep every lesson tied to a visible plot change.
- Use presets and explicit assumptions instead of claiming universal accuracy.
- Reveal truth in debriefs so mistakes are concrete.
- Add one concept per intro lesson.
- Test tactical plot readability early.

## Validation Plan

Use three validation loops:

- New-player usability: can the user complete the first lesson and explain bearing-only ambiguity?
- Intermediate-player usefulness: does repeated drill practice reduce estimate error?
- Community-author validation: can an instructor create a scenario without changing code?

## Future Ideas

- Task gating and lesson prerequisites.
- Maneuver timing and rapid-estimate scoring components.
- First-class hypothesis records separate from final estimates.
- Assisted hypothesis comparison.
- Monte Carlo uncertainty visualization.
- Optional audio recognition drills.
- Campaign-style progression.
- Community scenario packs.
- Exportable debrief images for coaching.
- Presets for specific game communities where naming and assumptions are licensing-safe.
