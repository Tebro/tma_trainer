import { describe, expect, it } from 'vitest';
import {
  ObservationGenerator,
  SeededRandom,
} from '../../src/simulation/observations';
import type { Contact, Scenario } from '../../src/simulation/scenarioTypes';

function makeScenario(overrides?: Partial<Scenario>): Scenario {
  const defaultContact: Contact = {
    id: 'C1',
    category: 'submarine',
    position: { x: 1000, y: 0 },
    course: 90,
    speed: 5,
  };

  return {
    id: 'test-scenario',
    title: 'Test Scenario',
    ownship: {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 0,
    },
    contacts: [defaultContact],
    sensor: {
      bearingNoiseDeg: 2,
      updateIntervalSec: 20,
      classificationAmbiguity: 'medium',
    },
    tasks: [],
    hints: [],
    debriefRules: [],
    durationSec: 120,
    ...overrides,
  } as Scenario;
}

describe('SeededRandom', () => {
  it('produces deterministic floats', () => {
    const r1 = new SeededRandom(42);
    const r2 = new SeededRandom(42);
    for (let i = 0; i < 10; i++) {
      expect(r1.nextFloat()).toBe(r2.nextFloat());
    }
  });

  it('produces deterministic ints', () => {
    const r1 = new SeededRandom('abc');
    const r2 = new SeededRandom('abc');
    for (let i = 0; i < 10; i++) {
      expect(r1.next()).toBe(r2.next());
    }
  });

  it('range stays within bounds', () => {
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const v = rng.range(-5, 10);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(10);
    }
  });
});

describe('ObservationGenerator.shouldGenerate', () => {
  it('returns true for exact interval multiples', () => {
    const gen = new ObservationGenerator(makeScenario());
    expect(gen.shouldGenerate(0)).toBe(true);
    expect(gen.shouldGenerate(20)).toBe(true);
    expect(gen.shouldGenerate(40)).toBe(true);
    expect(gen.shouldGenerate(120)).toBe(true);
  });

  it('returns false for non-multiples', () => {
    const gen = new ObservationGenerator(makeScenario());
    expect(gen.shouldGenerate(1)).toBe(false);
    expect(gen.shouldGenerate(19)).toBe(false);
    expect(gen.shouldGenerate(21)).toBe(false);
    expect(gen.shouldGenerate(35)).toBe(false);
    expect(gen.shouldGenerate(121)).toBe(false);
  });
});

describe('ObservationGenerator.generate', () => {
  it('returns observations at interval timestamps', () => {
    const gen = new ObservationGenerator(makeScenario());
    const atZero = gen.generate(0);
    expect(atZero.length).toBe(1);
    expect(atZero[0].timestampSec).toBe(0);
    expect(atZero[0].contactId).toBe('C1');
  });

  it('returns empty array when not on an interval', () => {
    const gen = new ObservationGenerator(makeScenario());
    expect(gen.generate(5)).toEqual([]);
    expect(gen.generate(15)).toEqual([]);
    expect(gen.generate(21)).toEqual([]);
  });

  it('includes all contacts', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'A',
            category: 'merchant',
            position: { x: 100, y: 0 },
            course: 0,
            speed: 0,
          },
          {
            id: 'B',
            category: 'submarine',
            position: { x: 0, y: 100 },
            course: 0,
            speed: 0,
          },
        ],
      })
    );
    const obs = gen.generate(20);
    expect(obs.length).toBe(2);
    expect(obs.map((o) => o.contactId).sort()).toEqual(['A', 'B']);
  });

  it('suppresses observations during configured contact dropout windows', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        sensor: {
          bearingNoiseDeg: 0,
          updateIntervalSec: 20,
          classificationAmbiguity: 'medium',
          contactDropouts: [{ contactId: 'C1', startSec: 40, endSec: 80 }],
        },
      })
    );

    expect(gen.generate(20)).toHaveLength(1);
    expect(gen.generate(40)).toHaveLength(0);
    expect(gen.generate(60)).toHaveLength(0);
    expect(gen.generate(80)).toHaveLength(0);
    expect(gen.generate(100)).toHaveLength(1);
  });

  it('produces identical results for identical inputs', () => {
    const gen = new ObservationGenerator(makeScenario(), 1337);
    const a = gen.generate(40);
    const b = gen.generate(40);
    expect(a).toEqual(b);
  });

  it('is side-effect free (repeatable across instances)', () => {
    const s = makeScenario();
    const g1 = new ObservationGenerator(s, 'seeded');
    const g2 = new ObservationGenerator(s, 'seeded');
    const all1 = g1.generateAll();
    const all2 = g2.generateAll();
    expect(all1).toEqual(all2);
  });

  it('bearing noise stays within configured bounds', () => {
    const noise = 3;
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'C',
            category: 'surface-combatant',
            position: { x: 5000, y: 0 },
            course: 0,
            speed: 0,
          },
        ],
        sensor: {
          bearingNoiseDeg: noise,
          updateIntervalSec: 10,
          classificationAmbiguity: 'low',
        },
        ownship: { position: { x: 0, y: 0 }, course: 0, speed: 0 },
        durationSec: 200,
      })
    );

    const all = gen.generateAll();
    for (const frame of all) {
      for (const obs of frame.observations) {
        const diff = Math.abs(obs.bearingDeg - 90);
        // Bearing is to the east, so true bearing is 90°
        const wrappedDiff = Math.min(diff, 360 - diff);
        expect(wrappedDiff).toBeLessThanOrEqual(noise);
      }
    }
  });

  it('different seeds produce different noise', () => {
    const s = makeScenario();
    const g1 = new ObservationGenerator(s, 1);
    const g2 = new ObservationGenerator(s, 2);
    const a = g1.generate(0);
    const b = g2.generate(0);
    expect(a[0].bearingDeg).not.toBe(b[0].bearingDeg);
  });

  it('observations have correct source', () => {
    const gen = new ObservationGenerator(makeScenario());
    const obs = gen.generate(0);
    for (const o of obs) {
      expect(o.source).toBe('sonar');
    }
  });

  it('signalCue defaults to distance-based string when no signature', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'Near',
            category: 'submarine',
            position: { x: 1000, y: 0 },
            course: 0,
            speed: 0,
          },
          {
            id: 'Far',
            category: 'submarine',
            position: { x: 50000, y: 0 },
            course: 0,
            speed: 0,
          },
        ],
      })
    );
    const obs = gen.generate(0);
    const near = obs.find((o) => o.contactId === 'Near')!;
    const far = obs.find((o) => o.contactId === 'Far')!;
    expect(near.signalCue).toBe('strong');
    expect(far.signalCue).toBe('weak');
  });

  it('signalCue uses contact signature when provided', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'Sig',
            category: 'submarine',
            position: { x: 1000, y: 0 },
            course: 0,
            speed: 0,
            signature: 'propeller-cavitation',
          },
        ],
      })
    );
    const obs = gen.generate(0);
    expect(obs[0].signalCue).toBe('propeller-cavitation');
  });

  it('confidence reflects category and ambiguity', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'Sub',
            category: 'submarine',
            position: { x: 1000, y: 0 },
            course: 0,
            speed: 0,
          },
          {
            id: 'Surface',
            category: 'surface-combatant',
            position: { x: 2000, y: 0 },
            course: 0,
            speed: 0,
          },
          {
            id: 'Merchant',
            category: 'merchant',
            position: { x: 3000, y: 0 },
            course: 0,
            speed: 0,
          },
        ],
        sensor: {
          bearingNoiseDeg: 1,
          updateIntervalSec: 10,
          classificationAmbiguity: 'medium',
        },
      })
    );
    const obs = gen.generate(0);
    const byId = Object.fromEntries(obs.map((o) => [o.contactId, o]));
    expect(byId['Sub'].confidence).toBe('low');
    expect(byId['Surface'].confidence).toBe('medium');
    expect(byId['Merchant'].confidence).toBe('high');
  });

  it('low ambiguity increases confidence', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'Sub',
            category: 'submarine',
            position: { x: 1000, y: 0 },
            course: 0,
            speed: 0,
          },
        ],
        sensor: {
          bearingNoiseDeg: 1,
          updateIntervalSec: 10,
          classificationAmbiguity: 'low',
        },
      })
    );
    const obs = gen.generate(0);
    expect(obs[0].confidence).toBe('medium');
  });

  it('high ambiguity decreases confidence (capped at low)', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'Merchant',
            category: 'merchant',
            position: { x: 1000, y: 0 },
            course: 0,
            speed: 0,
          },
        ],
        sensor: {
          bearingNoiseDeg: 1,
          updateIntervalSec: 10,
          classificationAmbiguity: 'high',
        },
      })
    );
    const obs = gen.generate(0);
    expect(obs[0].confidence).toBe('medium');
  });
});

describe('ObservationGenerator.generateAll', () => {
  it('covers 0 to durationSec inclusive on interval boundaries', () => {
    const gen = new ObservationGenerator(makeScenario({ durationSec: 120 }));
    const all = gen.generateAll();
    expect(all.length).toBe(7); // 0, 20, 40, 60, 80, 100, 120
    expect(all[0].timestampSec).toBe(0);
    expect(all[all.length - 1].timestampSec).toBe(120);
    for (const frame of all) {
      expect(frame.timestampSec % 20).toBe(0);
    }
  });

  it('each frame contains observations for all contacts', () => {
    const gen = new ObservationGenerator(
      makeScenario({
        contacts: [
          {
            id: 'A',
            category: 'merchant',
            position: { x: 100, y: 0 },
            course: 0,
            speed: 0,
          },
          {
            id: 'B',
            category: 'merchant',
            position: { x: 200, y: 0 },
            course: 0,
            speed: 0,
          },
        ],
      })
    );
    const all = gen.generateAll();
    for (const frame of all) {
      expect(frame.observations.length).toBe(2);
    }
  });

  it('produces the same results as individual generate calls', () => {
    const gen = new ObservationGenerator(makeScenario(), 'abc');
    const all = gen.generateAll();
    for (const frame of all) {
      const single = gen.generate(frame.timestampSec);
      expect(single).toEqual(frame.observations);
    }
  });
});
