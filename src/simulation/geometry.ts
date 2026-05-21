import type { Vector2 } from './scenarioTypes';

// ── Constants ───────────────────────────────────────────────────────────────

/** Degrees in a circle. */
export const FULL_CIRCLE_DEG = 360;

/** Standard gravitational knots-to-yards conversion factor. */
export const KNOTS_TO_YARDS_PER_SEC = 0.5067; // 1 kt ≈ 0.5067 yd/s

// ── Vector Operations ───────────────────────────────────────────────────────

export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVector(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s };
}

export function dotVectors(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function vectorLength(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function distanceBetween(a: Vector2, b: Vector2): number {
  return vectorLength(subVectors(a, b));
}

export function normalizeVector(v: Vector2): Vector2 {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return scaleVector(v, 1 / len);
}

// ── Angle / Course Utilities ────────────────────────────────────────────────

/**
 * Normalize an angle to the range [0, 360).
 * Works for positive, negative, and overshoot inputs.
 */
export function normalizeAngle(deg: number): number {
  return ((deg % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
}

/**
 * Shortest signed difference from `a` to `b` in degrees.
 * Result is in the range (-180, 180].
 * Example: angleDifference(350, 10) → 20
 * Example: angleDifference(10, 350) → -20
 */
export function angleDifference(from: number, to: number): number {
  const diff = normalizeAngle(to - from);
  return diff > 180 ? diff - 360 : diff;
}

/**
 * Absolute (magnitude only) shortest difference between two bearings/courses.
 * Result is in the range [0, 180].
 */
export function bearingDifference(a: number, b: number): number {
  return Math.abs(angleDifference(a, b));
}

// ── Bearing / Course Conversions ────────────────────────────────────────────

/**
 * Convert a course in degrees true (0° = east, 90° = north)
 * into a Cartesian unit vector (x, y).
 * This follows the navigation convention in the rest of the app:
 *   0°  = east   → (+x, +y) wait no, let me think...
 *
 * Actually in the TMA context above, if the scenario says course 45,
 * that means northeast. In standard math, northeast (45° from positive x axis)
 * gives x=cos(45), y=sin(45).
 *
 * But navigational convention:
 *   0°  = north (up)
 *   90° = east  (right)
 *   180° = south (down)
 *   270° = west  (left)
 *
 * So for navigation standard, course θ corresponds to:
 *   x = sin(θ) [east component]
 *   y = cos(θ) [north component]
 *
 * because:
 *   0°:  x=0, y=1 → north
 *   90°: x=1, y=0 → east
 *   180°: x=0, y=-1 → south
 *   270°: x=-1, y=0 → west
 */

/** Convert a navigation course into a Cartesian unit vector. */
export function courseToVector(courseDeg: number): Vector2 {
  const rad = (courseDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad),
    y: Math.cos(rad),
  };
}

/** Convert a Cartesian vector into a navigation course [0, 360). */
export function vectorToCourse(v: Vector2): number {
  // atan2(x, y) gives angle from north, clockwise, which matches nav convention
  const angle = Math.atan2(v.x, v.y);
  return normalizeAngle((angle * 180) / Math.PI);
}

/**
 * Bearing from observer to target in degrees true [0, 360).
 * Bearing is the direction the observer must look to see the target.
 */
export function bearingToTarget(observer: Vector2, target: Vector2): number {
  return vectorToCourse(subVectors(target, observer));
}

/**
 * Approximate bearing rate (degrees per second) between two consecutive observations.
 * Returns a positive or negative number in degrees/second.
 */
export function bearingRate(
  bearing1: number,
  bearing2: number,
  elapsedSec: number
): number {
  if (elapsedSec <= 0) return 0;
  return angleDifference(bearing1, bearing2) / elapsedSec;
}

// ── Dead Reckoning ──────────────────────────────────────────────────────────

/**
 * Predict a new position after moving at `speed` (knots) on `course` (degrees)
 * for `elapsedSec` (seconds).
 * Uses the navigational course convention (0° = north).
 */
export function deadReckon(
  position: Vector2,
  course: number,
  speedKts: number,
  elapsedSec: number
): Vector2 {
  const direction = courseToVector(course);
  const speedYdPerSec = speedKts * KNOTS_TO_YARDS_PER_SEC;
  const distanceYd = speedYdPerSec * elapsedSec;
  const delta = scaleVector(direction, distanceYd);
  return addVectors(position, delta);
}

// ── Closest Point of Approach Approximation ─────────────────────────────────

/**
 * Approximate closest point of approach (CPA) distance in yards.
 * Simple geometric CPA from two position vectors.
 */
export function closestPointOfApproach(
  a: Vector2,
  aCourse: number,
  aSpeedKts: number,
  b: Vector2,
  bCourse: number,
  bSpeedKts: number,
  elapsedSec: number
): number {
  const aNew = deadReckon(a, aCourse, aSpeedKts, elapsedSec);
  const bNew = deadReckon(b, bCourse, bSpeedKts, elapsedSec);
  return distanceBetween(aNew, bNew);
}

// ── Range / Bearing Polar Conversions ───────────────────────────────────────

/** Convert polar (range, bearing) to Cartesian offset from an origin. */
export function polarToCartesian(
  rangeYds: number,
  bearingDeg: number,
  origin: Vector2 = { x: 0, y: 0 }
): Vector2 {
  const rad = (bearingDeg * Math.PI) / 180;
  const dx = rangeYds * Math.sin(rad);
  const dy = rangeYds * Math.cos(rad);
  return { x: origin.x + dx, y: origin.y + dy };
}

/** Convert a Cartesian point to polar (range, bearing) relative to an origin. */
export function cartesianToPolar(
  point: Vector2,
  origin: Vector2 = { x: 0, y: 0 }
): { rangeYds: number; bearingDeg: number } {
  const rel = subVectors(point, origin);
  return {
    rangeYds: vectorLength(rel),
    bearingDeg: vectorToCourse(rel),
  };
}

// ── Unit Conversions ────────────────────────────────────────────────────────

export function knotsToYardsPerSecond(kts: number): number {
  return kts * KNOTS_TO_YARDS_PER_SEC;
}

export function yardsPerSecondToKnots(yps: number): number {
  return yps / KNOTS_TO_YARDS_PER_SEC;
}
