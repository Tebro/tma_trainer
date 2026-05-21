import { describe, expect, it } from 'vitest';
import {
  computeEntityState,
  generateTruthTrack,
  stepEntity,
} from '../../src/simulation/tracks';

describe('computeEntityState', () => {
  it('returns initial state at time 0', () => {
    const entity = {
      position: { x: 100, y: 200 },
      course: 45,
      speed: 8,
    };
    const state = computeEntityState(entity, 0);
    expect(state.position).toEqual({ x: 100, y: 200 });
    expect(state.course).toBe(45);
    expect(state.speed).toBe(8);
  });

  it('propagates with constant course and speed', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 1,
    };
    const state60 = computeEntityState(entity, 60);
    expect(state60.speed).toBe(1);
    expect(state60.course).toBe(0);
    expect(state60.position.x).toBeCloseTo(0, 10);
    expect(state60.position.y).toBeGreaterThan(0);

    // Symmetric check: 120 seconds should travel twice as far
    const state120 = computeEntityState(entity, 120);
    expect(state120.position.y).toBeCloseTo(state60.position.y * 2, 6);
  });

  it('propagates in all four cardinal directions', () => {
    const speed = 10; // knots
    const time = 60; // seconds

    // North
    const north = computeEntityState(
      { position: { x: 0, y: 0 }, course: 0, speed },
      time
    );
    expect(north.position.x).toBeCloseTo(0, 10);
    expect(north.position.y).toBeGreaterThan(0);

    // East
    const east = computeEntityState(
      { position: { x: 0, y: 0 }, course: 90, speed },
      time
    );
    expect(east.position.x).toBeGreaterThan(0);
    expect(east.position.y).toBeCloseTo(0, 10);

    // South
    const south = computeEntityState(
      { position: { x: 0, y: 0 }, course: 180, speed },
      time
    );
    expect(south.position.x).toBeCloseTo(0, 10);
    expect(south.position.y).toBeLessThan(0);

    // West
    const west = computeEntityState(
      { position: { x: 0, y: 0 }, course: 270, speed },
      time
    );
    expect(west.position.x).toBeLessThan(0);
    expect(west.position.y).toBeCloseTo(0, 10);
  });

  it('applies a speed maneuver at the correct time', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 5,
      maneuvers: [{ timeSec: 60, speed: 10 }],
    };

    // Before maneuver: travels 60s at 5 kts
    const before = computeEntityState(entity, 30);
    expect(before.speed).toBe(5);
    expect(before.position.y).toBeGreaterThan(0);

    // Right at maneuver time
    const at = computeEntityState(entity, 60);
    expect(at.speed).toBe(10);

    // After maneuver: travels 60s at 10 kts (further than 60s at 5 kts)
    const after = computeEntityState(entity, 120);
    expect(after.speed).toBe(10);
    expect(after.position.y).toBeGreaterThan(
      computeEntityState({ position: { x: 0, y: 0 }, course: 0, speed: 5 }, 120)
        .position.y
    );
  });

  it('applies a course maneuver at the correct time', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
      maneuvers: [{ timeSec: 60, course: 90 }],
    };

    const before = computeEntityState(entity, 30);
    expect(before.course).toBe(0);
    expect(before.position.x).toBeCloseTo(0, 10);

    const after = computeEntityState(entity, 120);
    expect(after.course).toBe(90);
    // After turning east, should have moved eastward after 60s
    expect(after.position.x).toBeGreaterThan(0);
  });

  it('applies multiple maneuvers in chronological order', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
      maneuvers: [
        { timeSec: 30, speed: 15 },
        { timeSec: 60, course: 90 },
        { timeSec: 90, speed: 5 },
      ],
    };

    // 0-30: 10 kts north
    const s30 = computeEntityState(entity, 30);
    expect(s30.course).toBe(0);
    expect(s30.speed).toBe(15);

    // 30-60: 15 kts north
    const s60 = computeEntityState(entity, 60);
    expect(s60.course).toBe(90);
    expect(s60.speed).toBe(15);

    // 60-90: 15 kts east
    const s90 = computeEntityState(entity, 90);
    expect(s90.course).toBe(90);
    expect(s90.speed).toBe(5);

    // 90-120: 5 kts east
    const s120 = computeEntityState(entity, 120);
    expect(s120.course).toBe(90);
    expect(s120.speed).toBe(5);
  });

  it('ignores maneuvers scheduled after target time', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
      maneuvers: [{ timeSec: 300, course: 180 }],
    };

    const s60 = computeEntityState(entity, 60);
    expect(s60.course).toBe(0);
    expect(s60.speed).toBe(10);
  });

  it('handles unsorted maneuvers in correct order', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
      maneuvers: [
        { timeSec: 60, course: 90 },
        { timeSec: 30, speed: 15 },
      ],
    };

    const s45 = computeEntityState(entity, 45);
    // After 30s speed change at 15 kts, 15s at 15 kts north
    expect(s45.speed).toBe(15);
    expect(s45.course).toBe(0);

    const s75 = computeEntityState(entity, 75);
    // After 60s course change to east
    expect(s75.course).toBe(90);
    expect(s75.speed).toBe(15);
  });

  it('does not mutate the input entity', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
    };
    const original = { ...entity, position: { ...entity.position } };
    computeEntityState(entity, 100);
    expect(entity.position).toEqual(original.position);
    expect(entity.course).toBe(original.course);
    expect(entity.speed).toBe(original.speed);
  });

  it('works with Contact type (has id, category, etc.)', () => {
    // ts-expects-no-error
    const contact: import('../../src/simulation/scenarioTypes').Contact = {
      id: 'S01',
      category: 'submarine',
      position: { x: 1000, y: 2000 },
      course: 270,
      speed: 12,
    };
    const state = computeEntityState(contact, 60);
    expect(state.course).toBe(270);
    expect(state.speed).toBe(12);
    expect(state.position.x).toBeLessThan(1000); // moving west
  });
});

describe('generateTruthTrack', () => {
  it('generates evenly spaced samples', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
    };
    const track = generateTruthTrack(entity, 60, 20);
    expect(track.length).toBe(4); // 0, 20, 40, 60
    expect(track[0].timestampSec).toBe(0);
    expect(track[1].timestampSec).toBe(20);
    expect(track[2].timestampSec).toBe(40);
    expect(track[3].timestampSec).toBe(60);
  });

  it('includes t=0 state matching initial conditions', () => {
    const entity = {
      position: { x: 500, y: 1000 },
      course: 45,
      speed: 8,
    };
    const track = generateTruthTrack(entity, 10, 5);
    expect(track[0].timestampSec).toBe(0);
    expect(track[0].state.position).toEqual({ x: 500, y: 1000 });
    expect(track[0].state.course).toBe(45);
    expect(track[0].state.speed).toBe(8);
  });

  it('includes maneuvers at correct times', () => {
    const entity = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
      maneuvers: [{ timeSec: 30, course: 90 }],
    };
    const track = generateTruthTrack(entity, 60, 10);
    expect(track.length).toBe(7); // 0, 10, 20, 30, 40, 50, 60

    // Before maneuver: x stays near 0
    expect(track[3].timestampSec).toBe(30);
    expect(track[3].state.course).toBe(90);

    // After maneuver: x increases
    expect(track[4].state.course).toBe(90);
    expect(track[4].state.position.x).toBeGreaterThan(
      track[3].state.position.x
    );
  });
});

describe('stepEntity', () => {
  it('advances by elapsed time', () => {
    const state = {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 10,
    };
    const s1 = stepEntity(state, 60);
    expect(s1.speed).toBe(10);
    expect(s1.course).toBe(0);
    expect(s1.position.y).toBeGreaterThan(0);

    const s2 = stepEntity(s1, 60);
    expect(s2.position.y).toBeCloseTo(s1.position.y * 2, 6);
  });

  it('does not change course or speed', () => {
    const state = {
      position: { x: 0, y: 0 },
      course: 180,
      speed: 5,
    };
    const next = stepEntity(state, 100);
    expect(next.course).toBe(180);
    expect(next.speed).toBe(5);
  });

  it('does not mutate input state', () => {
    const state = {
      position: { x: 10, y: 20 },
      course: 45,
      speed: 8,
    };
    const original = { ...state, position: { ...state.position } };
    stepEntity(state, 10);
    expect(state.position).toEqual(original.position);
    expect(state.course).toBe(original.course);
    expect(state.speed).toBe(original.speed);
  });
});
