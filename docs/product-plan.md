# Product Plan

## Vision

Build an interactive trainer for players of modern submarine games who want to understand TMA, passive sonar operation, contact classification, and tactical decision-making. The product should feel like a quiet training console: fast to use, dense with relevant information, and focused on practice rather than spectacle.

The trainer should not require users to own any specific game. It should teach transferable concepts while allowing presets that approximate common game models.

## Audience

### Primary Users

- New players who understand basic submarine game controls but do not understand TMA.
- Intermediate players who can detect contacts but struggle to build stable range, course, and speed estimates.
- Players preparing for multiplayer or higher-difficulty single-player scenarios.

### Secondary Users

- Community instructors creating practice scenarios.
- Content creators who want repeatable examples for tutorials.
- Advanced players who want fast drills for perishable skills.

## User Problems

- TMA concepts are hard to learn because the feedback loop in games is slow and often hidden.
- Players see bearing lines but do not understand how geometry, time, and ownship maneuvers change the solution.
- Sonar displays can feel like noise without a structured classification process.
- Game tutorials often explain buttons, not reasoning workflows.
- Players need a safe sandbox where mistakes are explained immediately.

## Product Principles

- Teach through interaction first, explanation second.
- Keep lessons short and replayable.
- Make uncertainty visible instead of pretending every estimate is exact.
- Separate game abstractions from real-world claims.
- Prefer configurable assumptions over one fixed simulation model.
- Debrief every scenario with concrete comparisons between user estimates and ground truth.

## Core Feature Set

### Interactive TMA Plot

- Bearing lines over time.
- Ownship track, estimated contact track, and hidden ground truth revealed during debrief.
- Tools for marking bearings, estimated range rings, course vectors, and uncertainty zones.
- Time controls for pause, step, slow, and fast-forward.

### Sonar Training Console

- Passive sonar waterfall or broadband/narrowband-inspired display.
- Contact list with bearing, bearing rate, signal strength, confidence, and classification notes.
- Audio cue placeholders or generated tones for simple pattern recognition drills.
- Classification workflow based on game-like signatures, not real-world databases.

### Guided Lessons

- Short lessons for core concepts: bearing-only ambiguity, bearing rate, ownship maneuvering, opening and closing contacts, and classification confidence.
- Inline tasks that require the user to make estimates before seeing the answer.
- "Why this matters in game" summaries tied to tactical choices.

### Practice Drills

- Five-to-ten-minute exercises focused on one skill.
- Randomized parameters inside constrained bounds.
- Immediate scoring against truth data.
- Difficulty controls for noise, contact speed, number of contacts, and sensor quality.

### Debrief And Review

- Compare user estimates to truth over time.
- Highlight when the user's solution improved or diverged.
- Explain useful observations: bearing rate changes, maneuver effects, likely classification errors, and missed opportunities.
- Store attempts so users can track progress.

## MVP Scope

The MVP target was:

- Browser-based single-user app.
- 2D tactical plot with ownship, hidden target, bearing history, and revealed debrief.
- Basic passive sonar contact list.
- Three guided lessons:
  - Why one bearing is not enough.
  - How bearing rate and time help constrain a solution.
  - How ownship maneuvers improve geometry.
- Five randomized drills:
  - Constant-bearing contact.
  - Crossing contact.
  - Opening contact.
  - Closing contact.
  - Two-contact classification and tracking.
- Attempt scoring for range, course, speed, and classification.
- Local storage for progress and settings.

Current implemented scope exceeds the original MVP in several areas:

- Nine randomized drill templates, including high-noise, maneuver-timing, rapid-estimate, and lost-contact/reacquire drills.
- Manual ownship maneuver controls in drill mode with maneuver logging.
- Timeline scrubber for manual time jumps.
- Tactical plot cursor range/bearing readout and click-to-suggest range.
- Debrief truth paths, estimate markers, estimate error lines, and layer toggles.
- Contact dropout windows for temporary observation loss.
- Attempt history view.

## Out Of Scope For MVP

- Real-time multiplayer.
- Exact replication of any one commercial game UI.
- Real-world signature libraries or real vessel databases.
- Weapon employment optimization.
- Classified, sensitive, or operationally specific naval tactics.
- Full environmental propagation modeling.
- Native desktop packaging.

The following are now the highest-value post-MVP product gaps:

- Lesson task gating so users must perform the intended observation or estimate before advancing.
- Scoring for maneuver timing and time-to-first-useful-estimate.
- Scenario editor, import/export, and community scenario sharing.
- Richer debrief coaching summaries beyond metric feedback.

## Differentiators

- Focused on player reasoning rather than button memorization.
- Explicitly visualizes uncertainty and ground-truth comparison.
- Supports both lesson mode and quick drills.
- Uses game-tunable assumptions so communities can adapt it to different titles.

## UX Shape

The first screen should be the trainer workspace, not a marketing page. The user should land in a lesson or drill with the tactical plot, sonar/contact panel, timeline controls, and estimate form visible.

Recommended app sections:

- Training workspace.
- Lesson library.
- Drill generator.
- Debrief archive.
- Scenario editor.
- Settings and game presets.

## Success Metrics

- Lesson completion rate.
- Drill retry rate.
- Improvement in estimation error over repeated attempts.
- Time from contact detection to first reasonable estimate.
- Percentage of users who complete at least one intermediate drill.
- Scenario sharing or import usage after the MVP.
