# Technical Design

## Architecture Overview

The app is a browser-based React single-page application with a deterministic simulation core, interactive visualization layer, lesson engine, drill generator, scoring/debrief layer, and local persistence. The simulation is separated from the UI so lessons, drills, tests, and future game adapters can reuse the same domain logic.

Current shape:

- Frontend framework: React + TypeScript + Vite.
- Rendering: SVG tactical plot.
- State: React component state plus deterministic simulation classes.
- Persistence: localStorage summaries for progress, attempts, and settings.
- Content: JSON lesson/scenario definitions.
- Testing: Vitest unit/integration tests plus TypeScript, ESLint, Prettier, and production build through `pnpm verify`.

## Domain Model

Core entities:

- `Scenario`: initial conditions, contacts, environment assumptions, lesson tasks, and scoring rules.
- `Ownship`: position, course, speed, depth abstraction, and maneuver schedule.
- `Contact`: truth track, emitted cues, classification category, and behavior profile.
- `SensorSettings`: noise, update interval, classification ambiguity, and optional contact dropout windows.
- `Observation`: timestamped bearing, signal cue, contact ID, confidence, and source.
- `Estimate`: user's range, course, speed, classification, confidence, and notes.
- `Maneuver`: ownship course or speed change requested by the user.
- `Debrief`: truth comparison, score, error history, and explanatory notes.

## Simulation Core

The MVP simulation can use a 2D plane with simplified kinematics:

- Positions represented in yards, meters, or nautical miles through a single internal unit.
- Courses represented in degrees true.
- Speeds represented in knots or normalized game units.
- Time advanced in fixed simulation ticks.
- Contacts follow constant course and speed unless the scenario defines maneuvers.
- Sensor observations derive from truth with configurable noise and update intervals.
- Contact dropout windows can suppress observations for lost-contact/reacquire drills.
- Drill-time ownship maneuvers update the active scenario and observation generator.

Important utilities:

- Bearing from ownship to contact.
- Bearing rate over time.
- Closest point of approach approximation.
- Dead reckoning for ownship and contacts.
- Estimate error calculation.
- Angle normalization and wrap-around handling.

## TMA Trainer Logic

The trainer should make uncertainty explicit without requiring a full mathematical solver in the first version.

MVP approach:

- Store user estimates and plot-click hypothesis markers.
- Show possible-position markers along latest bearings in ambiguity-focused contexts.
- Score submitted estimates against truth at the same timestamp.
- Explain under-constrained estimates and reveal truth paths/errors in debrief.

Future approach:

- Add optional assisted-solver mode that proposes candidate tracks.
- Let users compare multiple hypotheses.
- Add Monte Carlo sampling for possible contact tracks.
- Add game preset tuning for different observation and noise models.

## Sonar Model

The sonar model should be intentionally simplified and game-oriented.

MVP cues:

- Bearing.
- Bearing confidence.
- Signal strength.
- Broad category hints such as merchant, submarine, surface combatant, biologic, or unknown.
- Simplified narrowband-style labels using fictional signatures.
- Transient event cues such as speed change or course change.

Avoid:

- Real acoustic signature databases.
- Claims of real equipment fidelity.
- Operationally specific sonar procedures.

## UI Layout

The main workspace should fit the user's workflow:

- Center: tactical plot with ownship, bearing history, user marks, and timeline cursor.
- Plot overlays: cursor range/bearing readout, ownship course/speed, possible-position markers, estimate markers, truth paths, and debrief error lines.
- Left or top: lesson objective, current task, and hint controls.
- Right: sonar/contact panel with contact list and selected-contact details.
- Bottom: timeline controls, playback speed, and estimate submission form.
- Debrief overlay or route: truth replay, score breakdown, and explanation.
- Bottom: playback controls with play/pause, fixed step, speed, and draggable timeline scrubber.

The interface should support keyboard shortcuts eventually, but the MVP should be fully usable with visible controls.

## Data Files

Suggested directory shape once implementation begins:

```text
src/
  app/
  components/
  simulation/
  lessons/
  scoring/
  storage/
  styles/
content/
  lessons/
  scenarios/
tests/
  simulation/
  scoring/
```

Suggested ownership boundaries:

- `src/app/`: routing, workspace composition, and application-level state.
- `src/components/`: reusable UI components and feature panels.
- `src/simulation/`: deterministic domain logic for geometry, tracks, observations, playback, drills, and scenario editing.
- `src/scoring/`: estimate, classification, and debrief scoring.
- `src/lessons/`: lesson loading, task progression, hints, and completion logic.
- `src/storage/`: local persistence and data migrations.
- `content/`: lesson and scenario data owned by curriculum/content tasks.
- `tests/`: verification for the matching implementation area.

When assigning parallel work, prefer these boundaries and the task IDs in [Agent Task Breakdown](agent-task-breakdown.md). Shared contracts such as scenario schema, estimate model, and playback state should have one active owner at a time.

Suggested lesson JSON shape:

```json
{
  "id": "bearing-only-intro",
  "title": "Bearing-Only Ambiguity",
  "difficulty": "intro",
  "objectives": [
    "Explain why one bearing does not provide range",
    "Compare multiple possible target positions along one bearing"
  ],
  "initialConditions": {
    "ownship": { "x": 0, "y": 0, "course": 45, "speed": 8 },
    "contacts": [
      {
        "id": "S01",
        "category": "submarine",
        "x": 12000,
        "y": 8000,
        "course": 270,
        "speed": 12
      }
    ]
  },
  "sensor": {
    "bearingNoiseDeg": 1.5,
    "updateIntervalSec": 20,
    "classificationAmbiguity": "low"
  },
  "tasks": []
}
```

## Persistence

MVP local data:

- Completed lessons.
- Drill attempts.
- Best scores.
- User settings.
- Scenario editor drafts.

Current implementation stores lesson progress, attempt summaries, and settings in localStorage. Scenario editor drafts remain future work.

IndexedDB is preferable if attempts include time-series data. Local storage is acceptable for a prototype with small summaries.

## Testing Strategy

### Unit Tests

- Bearing calculations across quadrants.
- Angle wrap-around.
- Track propagation over time.
- Estimate scoring.
- Scenario randomization bounds.
- Deterministic seeded drills.
- Observation dropout windows.
- Scenario playback updates after drill maneuvers.

### Integration Tests

- Start lesson, advance time, submit estimate, view debrief.
- Create randomized drill and replay it.
- Store and reload progress.
- Change game preset and verify scenario assumptions update.

### Visual And Interaction Checks

- Plot does not resize unexpectedly during playback.
- Contact labels remain legible.
- Timeline controls work at desktop and mobile widths.
- Debrief truth overlay aligns with recorded observations.
- Debrief layer toggles remain readable and do not obscure critical plot information.

## Extensibility

Future adapters can map presets to different game expectations:

- Bearing noise and update cadence.
- Sensor confidence model.
- Contact categories.
- Display terminology.
- Unit preferences.
- Scenario pacing.

The app should avoid importing game assets unless licensing is explicit. Presets can be descriptive and community-authored without copying proprietary UI or data.
