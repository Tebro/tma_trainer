# Current Status

Last updated: 2026-05-21

## Summary

The app is now a working browser-based TMA trainer with guided lessons, seeded drills, an interactive tactical plot, playback controls, estimate submission, sonar-style cues, local progress/attempt storage, and debrief visualization.

The implementation is verified with `pnpm verify`, which currently runs lint, formatting checks, tests, TypeScript, and production build.

Current verification baseline:

- 10 test files passing.
- 213 tests passing.
- Production Vite build passing.

## Implemented

### Foundation

- React + TypeScript + Vite app shell.
- ESLint, Prettier, Vitest, TypeScript, and `pnpm verify` workflow.
- GitHub Pages build/deploy workflow.
- Content loaded from `content/lessons` and `content/scenarios`.

### Simulation Core

- 2D vector, bearing, course, and distance utilities.
- Ownship/contact track propagation with scheduled maneuvers.
- Deterministic observation generation with seeded noise.
- Contact dropout windows through `sensor.contactDropouts`.
- Scenario playback with time seek, reset, step, speed, and scenario updates.
- Estimate scoring for range, course, speed, and classification.

### Lessons

- Lesson library with local completion/best-score display.
- Three guided lessons:
  - Bearing-only ambiguity.
  - Bearing rate.
  - Ownship maneuvering.
- Lesson task panel with objectives, task text, hints, and completion flow.
- Intro lesson now explicitly teaches that bearing-only range is under-constrained.

### Tactical Plot And Workspace

- SVG tactical plot with ownship, bearing history, current time, ownship course/speed overlay, and cursor readout.
- Cursor readout shows bearing/range from ownship to cursor.
- Clicking the plot creates a hypothesis marker and can suggest range to the estimate form.
- Historical bearing lines originate from ownship position at the observation timestamp.
- Live playback animates via React-owned `requestAnimationFrame` loops.
- Draggable timeline scrubber supports manual time jumps.

### Drills

- Drill library with difficulty selector.
- Seeded drill generation with randomized ownship course/speed.
- Drill workspace with estimate form, contact panel, playback, and manual ownship maneuvers.
- Maneuver log records course/speed commands with simulated timestamp.
- Current drill templates:
  - Constant Bearing.
  - Crossing Contact.
  - Opening Contact.
  - Closing Contact.
  - Two-Contact Classification.
  - High-Noise Bearing-Only.
  - Maneuver Timing.
  - Rapid Estimate.
  - Lost Contact / Reacquire.

### Sonar And Classification

- Fictional sonar cue model.
- Cue clarity levels and transient notes.
- Classification controls for two-contact classification drills.
- Classification scoring helpers.

### Debrief And Persistence

- Debrief view with score breakdown, feedback, truth reveal, and explanation.
- Debrief tactical plot shows truth paths, estimate markers, and estimate error lines.
- Debrief layer toggles for bearings, ownship path, contact paths, estimates, and error lines.
- Local storage persistence for lesson progress, attempts, and settings.
- Attempt history view.

## Known Limitations

- Lesson task progression is not strongly gated yet; users can advance tasks before taking the intended action.
- Drill scoring does not yet score maneuver timing quality or time-to-first-useful-estimate directly.
- Estimate form still asks for range/course/speed together; partial estimates are not first-class records.
- Debrief overlays are useful but can become visually dense; layer toggles help but more legend/explanation may be needed.
- No scenario editor or import/export UI exists yet.
- No community content packaging workflow exists yet.

## Recommended Next Work

1. Add lesson task gating so tasks require observation, time advancement, or estimate submission where appropriate.
2. Add scoring components for maneuver timing and rapid-estimate time pressure.
3. Add first-class hypothesis records separate from final estimates.
4. Build scenario import/export and validation UI.
5. Add richer debrief coaching: “best observation,” “most damaging assumption,” and “what to try next.”
6. Add component/integration tests for debrief layer toggles and drill maneuver controls.
