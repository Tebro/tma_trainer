import { describe, expect, it } from 'vitest';
import {
  addVectors,
  angleDifference,
  bearingDifference,
  bearingRate,
  bearingToTarget,
  cartesianToPolar,
  closestPointOfApproach,
  courseToVector,
  deadReckon,
  distanceBetween,
  dotVectors,
  KNOTS_TO_YARDS_PER_SEC,
  knotsToYardsPerSecond,
  normalizeAngle,
  polarToCartesian,
  scaleVector,
  subVectors,
  vectorLength,
  vectorToCourse,
  yardsPerSecondToKnots,
} from '../../src/simulation/geometry';

describe('normalizeAngle', () => {
  it('leaves 0 unchanged', () => {
    expect(normalizeAngle(0)).toBe(0);
  });

  it('leaves 180 unchanged', () => {
    expect(normalizeAngle(180)).toBe(180);
  });

  it('wraps 360 to 0', () => {
    expect(normalizeAngle(360)).toBe(0);
  });

  it('wraps 720 to 0', () => {
    expect(normalizeAngle(720)).toBe(0);
  });

  it('wraps negative angles', () => {
    expect(normalizeAngle(-90)).toBe(270);
  });

  it('wraps -360 to 0', () => {
    expect(normalizeAngle(-360)).toBe(0);
  });

  it('wraps -450 to 270', () => {
    expect(normalizeAngle(-450)).toBe(270);
  });
});

describe('angleDifference', () => {
  it('returns 0 for identical angles', () => {
    expect(angleDifference(45, 45)).toBe(0);
  });

  it('returns positive for clockwise difference', () => {
    expect(angleDifference(0, 90)).toBe(90);
  });

  it('returns negative for counter-clockwise difference', () => {
    expect(angleDifference(90, 0)).toBe(-90);
  });

  it('wraps across 0/360 boundary (350 to 10)', () => {
    expect(angleDifference(350, 10)).toBe(20);
  });

  it('wraps across 0/360 boundary (10 to 350)', () => {
    expect(angleDifference(10, 350)).toBe(-20);
  });

  it('handles near 180 correctly (179 to -179)', () => {
    expect(angleDifference(179, 181)).toBe(2);
  });

  it('handles 180 exactly as positive', () => {
    expect(angleDifference(0, 180)).toBe(180);
  });
});

describe('bearingDifference', () => {
  it('returns 0 for identical bearings', () => {
    expect(bearingDifference(0, 0)).toBe(0);
  });

  it('returns shortest distance across wrap', () => {
    expect(bearingDifference(350, 10)).toBe(20);
    expect(bearingDifference(10, 350)).toBe(20);
  });

  it('returns 180 for opposite bearings', () => {
    expect(bearingDifference(0, 180)).toBe(180);
  });
});

describe('courseToVector', () => {
  it('returns (0, 1) for north (0°)', () => {
    const v = courseToVector(0);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(1, 10);
  });

  it('returns (1, 0) for east (90°)', () => {
    const v = courseToVector(90);
    expect(v.x).toBeCloseTo(1, 10);
    expect(v.y).toBeCloseTo(0, 10);
  });

  it('returns (0, -1) for south (180°)', () => {
    const v = courseToVector(180);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(-1, 10);
  });

  it('returns (-1, 0) for west (270°)', () => {
    const v = courseToVector(270);
    expect(v.x).toBeCloseTo(-1, 10);
    expect(v.y).toBeCloseTo(0, 10);
  });

  it('handles all four quadrants', () => {
    // Northeast (45°)
    const ne = courseToVector(45);
    expect(ne.x).toBeCloseTo(Math.sqrt(2) / 2, 10);
    expect(ne.y).toBeCloseTo(Math.sqrt(2) / 2, 10);

    // Southeast (135°)
    const se = courseToVector(135);
    expect(se.x).toBeCloseTo(Math.sqrt(2) / 2, 10);
    expect(se.y).toBeCloseTo(-Math.sqrt(2) / 2, 10);

    // Southwest (225°)
    const sw = courseToVector(225);
    expect(sw.x).toBeCloseTo(-Math.sqrt(2) / 2, 10);
    expect(sw.y).toBeCloseTo(-Math.sqrt(2) / 2, 10);

    // Northwest (315°)
    const nw = courseToVector(315);
    expect(nw.x).toBeCloseTo(-Math.sqrt(2) / 2, 10);
    expect(nw.y).toBeCloseTo(Math.sqrt(2) / 2, 10);
  });
});

describe('vectorToCourse', () => {
  it('returns 0 for north', () => {
    expect(vectorToCourse({ x: 0, y: 1 })).toBe(0);
  });

  it('returns 90 for east', () => {
    expect(vectorToCourse({ x: 1, y: 0 })).toBe(90);
  });

  it('returns 180 for south', () => {
    expect(vectorToCourse({ x: 0, y: -1 })).toBe(180);
  });

  it('returns 270 for west', () => {
    expect(vectorToCourse({ x: -1, y: 0 })).toBe(270);
  });

  it('round-trips with courseToVector', () => {
    const courses = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    for (const course of courses) {
      const v = courseToVector(course);
      const recovered = vectorToCourse(v);
      expect(recovered).toBeCloseTo(normalizeAngle(course), 6);
    }
  });
});

describe('vector operations', () => {
  it('addVectors', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 4 };
    expect(addVectors(a, b)).toEqual({ x: 4, y: 6 });
  });

  it('subVectors', () => {
    const a = { x: 5, y: 3 };
    const b = { x: 2, y: 1 };
    expect(subVectors(a, b)).toEqual({ x: 3, y: 2 });
  });

  it('scaleVector', () => {
    const v = { x: 2, y: 3 };
    expect(scaleVector(v, 2)).toEqual({ x: 4, y: 6 });
    expect(scaleVector(v, 0)).toEqual({ x: 0, y: 0 });
    expect(scaleVector(v, -1)).toEqual({ x: -2, y: -3 });
  });

  it('dotVectors', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 4 };
    expect(dotVectors(a, b)).toBe(11);
  });

  it('vectorLength', () => {
    expect(vectorLength({ x: 3, y: 4 })).toBe(5);
    expect(vectorLength({ x: 0, y: 0 })).toBe(0);
  });

  it('distanceBetween', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('bearingToTarget', () => {
  it('returns north when target is directly north', () => {
    expect(bearingToTarget({ x: 0, y: 0 }, { x: 0, y: 100 })).toBe(0);
  });

  it('returns east when target is directly east', () => {
    expect(bearingToTarget({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe(90);
  });

  it('returns south when target is directly south', () => {
    expect(bearingToTarget({ x: 0, y: 0 }, { x: 0, y: -100 })).toBe(180);
  });

  it('returns west when target is directly west', () => {
    expect(bearingToTarget({ x: 0, y: 0 }, { x: -100, y: 0 })).toBe(270);
  });

  it('returns northeast for northeast target', () => {
    const bearing = bearingToTarget({ x: 0, y: 0 }, { x: 100, y: 100 });
    expect(bearing).toBeCloseTo(45, 6);
  });
});

describe('deadReckon', () => {
  it('moves north at 0°', () => {
    const start = { x: 0, y: 0 };
    const end = deadReckon(start, 0, 1, 1);
    expect(end.x).toBeCloseTo(0, 10);
    expect(end.y).toBeCloseTo(KNOTS_TO_YARDS_PER_SEC, 6);
  });

  it('moves east at 90°', () => {
    const start = { x: 0, y: 0 };
    const end = deadReckon(start, 90, 1, 1);
    expect(end.x).toBeCloseTo(KNOTS_TO_YARDS_PER_SEC, 6);
    expect(end.y).toBeCloseTo(0, 10);
  });

  it('moves south at 180°', () => {
    const start = { x: 0, y: 0 };
    const end = deadReckon(start, 180, 1, 1);
    expect(end.x).toBeCloseTo(0, 10);
    expect(end.y).toBeCloseTo(-KNOTS_TO_YARDS_PER_SEC, 6);
  });

  it('moves west at 270°', () => {
    const start = { x: 0, y: 0 };
    const end = deadReckon(start, 270, 1, 1);
    expect(end.x).toBeCloseTo(-KNOTS_TO_YARDS_PER_SEC, 6);
    expect(end.y).toBeCloseTo(0, 10);
  });

  it('scales with speed', () => {
    const start = { x: 0, y: 0 };
    const end = deadReckon(start, 0, 10, 1);
    expect(end.y).toBeCloseTo(10 * KNOTS_TO_YARDS_PER_SEC, 6);
  });

  it('scales with time', () => {
    const start = { x: 0, y: 0 };
    const end = deadReckon(start, 0, 1, 60);
    expect(end.y).toBeCloseTo(60 * KNOTS_TO_YARDS_PER_SEC, 6);
  });

  it('does not move with zero speed', () => {
    const start = { x: 5, y: -3 };
    const end = deadReckon(start, 45, 0, 100);
    expect(end.x).toBeCloseTo(5, 10);
    expect(end.y).toBeCloseTo(-3, 10);
  });
});

describe('bearingRate', () => {
  it('returns 0 for identical bearings', () => {
    expect(bearingRate(45, 45, 10)).toBe(0);
  });

  it('computes positive rate when bearing increases', () => {
    expect(bearingRate(0, 90, 30)).toBe(3);
  });

  it('computes negative rate when bearing decreases', () => {
    expect(bearingRate(90, 0, 30)).toBe(-3);
  });

  it('wraps across 0/360 correctly', () => {
    // Bearing changes from 350° to 10° → +20° in 10s → +2°/s
    expect(bearingRate(350, 10, 10)).toBe(2);
  });

  it('returns 0 for zero elapsed time', () => {
    expect(bearingRate(0, 90, 0)).toBe(0);
  });
});

describe('closestPointOfApproach', () => {
  it('returns 0 for two objects at the same point', () => {
    const pos = { x: 0, y: 0 };
    const cpa = closestPointOfApproach(pos, 0, 0, pos, 0, 0, 100);
    expect(cpa).toBeCloseTo(0, 10);
  });

  it('decreases when two objects converge', () => {
    const posA = { x: 0, y: 0 };
    const posB = { x: 1000, y: 0 };
    const cpa1 = closestPointOfApproach(posA, 90, 10, posB, 270, 0, 10);
    const cpa2 = closestPointOfApproach(posA, 90, 10, posB, 270, 0, 100);
    expect(cpa2).toBeLessThan(cpa1);
  });

  it('remains constant when objects move parallel at same speed', () => {
    const posA = { x: 0, y: 0 };
    const posB = { x: 0, y: 1000 };
    const cpa1 = closestPointOfApproach(posA, 90, 10, posB, 90, 10, 10);
    const cpa2 = closestPointOfApproach(posA, 90, 10, posB, 90, 10, 100);
    expect(cpa2).toBeCloseTo(cpa1, 6);
  });
});

describe('polarToCartesian / cartesianToPolar', () => {
  it('round-trips north', () => {
    const origin = { x: 0, y: 0 };
    const point = polarToCartesian(1000, 0, origin);
    expect(point.x).toBeCloseTo(0, 10);
    expect(point.y).toBeCloseTo(1000, 6);
    const polar = cartesianToPolar(point, origin);
    expect(polar.rangeYds).toBeCloseTo(1000, 10);
    expect(polar.bearingDeg).toBeCloseTo(0, 10);
  });

  it('round-trips east', () => {
    const origin = { x: 5, y: 5 };
    const point = polarToCartesian(500, 90, origin);
    expect(point.x).toBeCloseTo(505, 6);
    expect(point.y).toBeCloseTo(5, 10);
    const polar = cartesianToPolar(point, origin);
    expect(polar.rangeYds).toBeCloseTo(500, 6);
    expect(polar.bearingDeg).toBeCloseTo(90, 10);
  });

  it('round-trips south', () => {
    const origin = { x: 0, y: 0 };
    const point = polarToCartesian(1000, 180, origin);
    const polar = cartesianToPolar(point, origin);
    expect(polar.rangeYds).toBeCloseTo(1000, 10);
    expect(polar.bearingDeg).toBeCloseTo(180, 10);
  });

  it('round-trips west', () => {
    const origin = { x: 0, y: 0 };
    const point = polarToCartesian(1000, 270, origin);
    const polar = cartesianToPolar(point, origin);
    expect(polar.rangeYds).toBeCloseTo(1000, 10);
    expect(polar.bearingDeg).toBeCloseTo(270, 10);
  });
});

describe('unit conversions', () => {
  it('knotsToYardsPerSecond matches constant', () => {
    expect(knotsToYardsPerSecond(1)).toBe(KNOTS_TO_YARDS_PER_SEC);
  });

  it('yardsPerSecondToKnots inverts', () => {
    const yps = knotsToYardsPerSecond(5);
    expect(yardsPerSecondToKnots(yps)).toBeCloseTo(5, 10);
  });
});
