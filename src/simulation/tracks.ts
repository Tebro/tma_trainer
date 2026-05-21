import type { Contact, Maneuver, Ownship, Vector2 } from './scenarioTypes';
import { deadReckon } from './geometry';

/** Snapshot of an entity at a point in simulated time. */
export interface EntityState {
  position: Vector2;
  course: number;
  speed: number;
}

/** Type that Ownship and Contact share for propagation. */
type KinematicEntity = Ownship | Contact;

function sortManeuvers(maneuvers: Maneuver[] | undefined): Maneuver[] {
  if (!maneuvers || maneuvers.length === 0) return [];
  return [...maneuvers].sort((a, b) => a.timeSec - b.timeSec);
}

/**
 * Compute the state (position, course, speed) of an entity at a given
 * simulated time `targetSec`, accounting for scheduled maneuvers.
 *
 * The entity starts at its initial position with initial course/speed.
 * Maneuvers are applied in chronological order at their scheduled times.
 * After the last applicable maneuver, the entity continues with the
 * most recent course/speed until `targetSec`.
 */
export function computeEntityState(
  entity: KinematicEntity,
  targetSec: number
): EntityState {
  const sorted = sortManeuvers(entity.maneuvers);

  let position: Vector2 = { ...entity.position };
  let course = entity.course;
  let speed = entity.speed;
  let currentTime = 0;

  for (const maneuver of sorted) {
    if (maneuver.timeSec > targetSec) {
      break;
    }

    // Advance to maneuver time with current course/speed
    const dt = maneuver.timeSec - currentTime;
    if (dt > 0) {
      position = deadReckon(position, course, speed, dt);
    }

    // Apply maneuver
    if (maneuver.course !== undefined) {
      course = maneuver.course;
    }
    if (maneuver.speed !== undefined) {
      speed = maneuver.speed;
    }

    currentTime = maneuver.timeSec;
  }

  // Advance remainder to target time
  const dt = targetSec - currentTime;
  if (dt > 0) {
    position = deadReckon(position, course, speed, dt);
  }

  return { position: { ...position }, course, speed };
}

/**
 * Generate a series of truth states at evenly spaced time intervals.
 *
 * @param entity  The kinematic entity to propagate.
 * @param totalSec  Total simulation time in seconds.
 * @param intervalSec  Interval between samples.
 * @returns An array of [timestampSec, state] tuples.
 */
export function generateTruthTrack(
  entity: KinematicEntity,
  totalSec: number,
  intervalSec: number
): Array<{ timestampSec: number; state: EntityState }> {
  const track: Array<{ timestampSec: number; state: EntityState }> = [];
  const count = Math.floor(totalSec / intervalSec) + 1;

  for (let i = 0; i < count; i++) {
    const t = i * intervalSec;
    track.push({
      timestampSec: t,
      state: computeEntityState(entity, t),
    });
  }

  return track;
}

/**
 * Advance an entity by a fixed time `elapsedSec` using its *current*
 * course and speed. This is useful for incremental stepping in playback.
 *
 * Does **not** look at maneuvers — the caller is responsible for
 * applying maneuvers before calling this at the correct time.
 */
export function stepEntity(
  state: EntityState,
  elapsedSec: number
): EntityState {
  return {
    position: deadReckon(state.position, state.course, state.speed, elapsedSec),
    course: state.course,
    speed: state.speed,
  };
}
