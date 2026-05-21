# Curriculum And Scenarios

## Curriculum Goals

The curriculum should teach users to think in observations, hypotheses, maneuvers, and verification. It should build from simple bearing-only ambiguity to multi-contact management, while keeping every exercise tied to what a submarine game player sees on screen.

## Learning Path

### 1. Contact Basics

Teach what a contact is, why passive detection gives limited information, and why a bearing is a direction rather than a position.

Expected outcomes:

- User can distinguish bearing, range, course, and speed.
- User understands that a single bearing line contains many possible target positions.
- User can record contact observations consistently.

Practice:

- Mark a contact bearing from ownship.
- Choose which possible target positions are consistent with the bearing.
- Identify how stale bearings become less useful over time.

### 2. Bearing Rate

Teach that bearing changes over time provide clues about relative motion, but do not automatically reveal exact range or course.

Expected outcomes:

- User can describe bearing rate as change in bearing over time.
- User can recognize steady, increasing, and decreasing bearing rate patterns.
- User can explain why low bearing rate may indicate long range, similar course, or a dangerous constant-bearing situation depending on context.

Practice:

- Watch a plotted contact over simulated time.
- Estimate whether the contact is crossing, opening, or closing.
- Compare estimates against truth in the debrief.

### 3. Ownship Maneuvering

Teach how changes in ownship course or speed create better observation geometry.

Expected outcomes:

- User can choose a maneuver that helps separate possible target solutions.
- User understands that maneuvering may improve TMA while changing tactical risk.
- User can compare pre-maneuver and post-maneuver bearing histories.

Practice:

- Choose between two or three candidate maneuvers.
- Observe how bearing lines converge or diverge.
- Score how much the maneuver reduced solution uncertainty.

### 4. Estimation Workflow

Teach a repeatable loop: observe, hypothesize, maneuver, update, and decide.

Expected outcomes:

- User can maintain a contact notebook.
- User can update estimates instead of anchoring on the first guess.
- User can identify when confidence is too low for a tactical decision.

Practice:

- Build a solution over a five-minute scenario.
- Submit range, course, speed, and classification estimates at multiple checkpoints.
- Review estimate error over time.

### 5. Sonar Classification

Teach game-like classification using signal strength, bearing consistency, transient cues, and simplified signature categories.

Expected outcomes:

- User can separate detection, tracking, and classification.
- User can assign confidence levels to classification guesses.
- User can manage contacts without over-trusting a weak cue.

Practice:

- Classify contacts from simplified narrowband-style hints.
- Handle false positives and ambiguous contacts.
- Reclassify contacts after new information arrives.

### 6. Multi-Contact Management

Teach prioritization and contact hygiene when several contacts are present.

Expected outcomes:

- User can keep contact IDs consistent.
- User can identify which contact needs immediate attention.
- User can avoid mixing observations from different contacts.

Practice:

- Track two or three contacts with crossing bearings.
- Resolve contact swaps.
- Prioritize classification and TMA effort.

## Scenario Types

Current implemented drill templates cover the scenario types below plus four additional practice variants: high-noise bearing-only, maneuver timing, rapid estimate, and lost-contact/reacquire.

### Bearing-Only Intro

One contact, constant course and speed, clean sensor data. User learns that bearing alone does not determine range.

Parameters:

- Contact course: fixed.
- Contact speed: slow to moderate.
- Noise: low.
- Duration: 3 to 5 simulated minutes.

### Crossing Contact

One contact crosses ownship's general line of advance. User practices bearing rate interpretation.

Parameters:

- Contact starts offset from ownship track.
- Bearing rate is visible but not extreme.
- User submits course and speed estimates.

### Opening Contact

Contact is moving away or increasing range. User learns why signal strength and bearing rate can both be misleading.

Parameters:

- Gradual signal reduction.
- Low to moderate bearing rate.
- Debrief emphasizes uncertainty.

### Closing Contact

Contact reduces range. User practices risk-aware estimation and early confidence management.

Parameters:

- Signal strength increases over time.
- Bearing may change slowly if geometry is poor.
- User must decide when to maneuver.

### Post-Maneuver Solution

User must choose a maneuver, observe new bearings, and update the estimated solution.

Parameters:

- Initial geometry is ambiguous.
- One maneuver improves geometry more than another.
- Score includes uncertainty reduction.

### Contact Classification Drill

User sees two or more contacts with simplified sonar cues and must classify each contact with confidence.

Parameters:

- Signature categories are fictional and game-like.
- Some cues are ambiguous.
- Incorrect high-confidence guesses are penalized.

### Multi-Contact Sorting

User tracks multiple contacts with overlapping or crossing bearings.

Parameters:

- Contact count: 2 to 4.
- Moderate noise.
- Possible temporary contact loss.
- Score includes correct contact ID continuity.

### High-Noise Bearing-Only

User works from sparse, noisy passive bearings and must avoid overfitting a single observation.

Parameters:

- One contact.
- Elevated bearing noise.
- Longer update interval.
- Debrief emphasizes trend estimation.

### Maneuver Timing

User practices deciding when to turn or change speed to improve geometry.

Parameters:

- One contact with initially weak geometry.
- Manual ownship maneuver controls are available.
- Debrief emphasizes pre- and post-maneuver assumptions.

### Rapid Estimate

User has a short time window to produce a useful first solution.

Parameters:

- Short duration.
- Fast update cadence.
- Contact starts close enough that early approximation matters.

Current limitation: scoring does not yet directly reward time-to-first-useful-estimate.

### Lost Contact / Reacquire

User maintains a predicted solution through temporary observation loss.

Parameters:

- One contact.
- Configured `sensor.contactDropouts` window suppresses observations.
- Reacquired bearings should be used to correct the predicted solution.

## Difficulty Model

Difficulty should be controlled by independent settings:

- Number of contacts.
- Sensor noise.
- Bearing update interval.
- Contact maneuvering frequency.
- Initial solution ambiguity.
- Ownship speed and maneuver constraints.
- Classification cue clarity.
- Time pressure.

## Scoring Model

Each drill should produce both numeric scores and qualitative feedback.

### Numeric Components

- Range estimate error.
- Course estimate error.
- Speed estimate error.
- Classification accuracy.
- Confidence calibration.
- Contact ID continuity.
- Time to first useful estimate.
- Improvement after ownship maneuver.

Current implementation scores range, course, speed, classification, and aggregate components. Time-to-first-useful-estimate, maneuver-quality scoring, contact ID continuity, and uncertainty-reduction scoring remain planned extensions.

### Feedback Components

- Best observation the user made.
- Most damaging wrong assumption.
- Whether the selected maneuver improved the geometry.
- How uncertainty changed over time.
- What the user should try on replay.

## Lesson Authoring Format

Lessons should be data-driven so new content can be added without changing application code.

Suggested fields:

- `id`
- `title`
- `summary`
- `learning_objectives`
- `initial_conditions`
- `events`
- `tasks`
- `hints`
- `debrief_rules`
- `difficulty`
- `tags`

## Content Safety Boundary

The curriculum should describe concepts at the level needed for games and simulations. Avoid real vessel databases, classified or sensitive details, real-world tactical procedures, and claims that the app provides professional naval instruction.
