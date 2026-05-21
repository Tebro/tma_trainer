import type {
  ContactCategory,
  Observation,
  ObservationConfidence,
  ObservationSource,
  Scenario,
} from './scenarioTypes';
import { bearingToTarget, distanceBetween, normalizeAngle } from './geometry';
import { computeEntityState } from './tracks';

// ── Seeded PRNG (LCG) ───────────────────────────────────────────────────────

/** Simple 32-bit Linear Congruential Generator for deterministic noise. */
export class SeededRandom {
  private state: number;

  constructor(seed: string | number = 0) {
    this.state = typeof seed === 'string' ? hashString(seed) : seed;
    // Warm-up to avoid poor initial distribution when seed is tiny
    for (let i = 0; i < 8; i++) {
      this.next();
    }
  }

  /** Return next integer in [0, 2^32). */
  next(): number {
    // Numerical Recipes LCG constants
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state;
  }

  /** Next float in [0, 1). */
  nextFloat(): number {
    return this.next() / 4294967296; // 2^32
  }

  /** Next float in [min, max). */
  range(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Confidence & Signal Heuristics ──────────────────────────────────────────

const CATEGORY_CONFIDENCE_BASE: Record<ContactCategory, number> = {
  submarine: 0,
  biologic: 0,
  unknown: 0,
  'surface-combatant': 1,
  merchant: 2,
};

const AMBIGUITY_MODIFIER: Record<
  Scenario['sensor']['classificationAmbiguity'],
  number
> = {
  low: 1,
  medium: 0,
  high: -1,
};

const CONFIDENCE_LEVELS: ObservationConfidence[] = ['low', 'medium', 'high'];

function computeConfidence(
  category: ContactCategory,
  ambiguity: Scenario['sensor']['classificationAmbiguity']
): ObservationConfidence {
  const base = CATEGORY_CONFIDENCE_BASE[category];
  const mod = AMBIGUITY_MODIFIER[ambiguity];
  const idx = Math.max(0, Math.min(2, base + mod));
  return CONFIDENCE_LEVELS[idx];
}

function computeSignalCue(
  distanceYds: number,
  signature?: string
): string | undefined {
  if (signature) {
    return signature;
  }
  if (distanceYds > 15000) return 'weak';
  if (distanceYds > 8000) return 'moderate';
  return 'strong';
}

function computeSource(): ObservationSource {
  return 'sonar';
}

// ── Observation Generator ───────────────────────────────────────────────────

/**
 * Generates deterministic, seeded sensor observations from a Scenario.
 *
 * Each call with the same inputs produces the same output.
 */
export class ObservationGenerator {
  private readonly scenario: Scenario;
  private readonly baseSeed: string | number;

  constructor(scenario: Scenario, seed?: string | number) {
    this.scenario = scenario;
    this.baseSeed = seed ?? 0;
  }

  /**
   * Returns true when the given timestamp aligns with the sensor's
   * update interval (i.e. `timestampSec % interval === 0`).
   */
  shouldGenerate(timestampSec: number): boolean {
    const interval = this.scenario.sensor.updateIntervalSec;
    if (interval <= 0) return false;
    return timestampSec % interval === 0;
  }

  /**
   * Generate observations for a single instant in simulated time.
   *
   * Returns an empty array if `shouldGenerate(timestampSec)` is false.
   */
  generate(timestampSec: number): Observation[] {
    if (!this.shouldGenerate(timestampSec)) {
      return [];
    }

    const ownshipState = computeEntityState(
      this.scenario.ownship,
      timestampSec
    );
    const noiseDeg = this.scenario.sensor.bearingNoiseDeg;

    const observations: Observation[] = [];

    for (const contact of this.scenario.contacts) {
      if (isContactDropped(this.scenario, contact.id, timestampSec)) {
        continue;
      }

      const contactState = computeEntityState(contact, timestampSec);
      const trueBearing = bearingToTarget(
        ownshipState.position,
        contactState.position
      );

      // Deterministic per-observation seed: base + timestamp + contact id
      const seed = `${this.baseSeed}:${timestampSec}:${contact.id}`;
      const rng = new SeededRandom(seed);
      const noise = rng.range(-noiseDeg, noiseDeg);
      const bearingDeg = normalizeAngle(trueBearing + noise);

      const dist = distanceBetween(
        ownshipState.position,
        contactState.position
      );

      observations.push({
        timestampSec,
        bearingDeg,
        signalCue: computeSignalCue(dist, contact.signature),
        contactId: contact.id,
        confidence: computeConfidence(
          contact.category,
          this.scenario.sensor.classificationAmbiguity
        ),
        source: computeSource(),
      });
    }

    return observations;
  }

  /**
   * Generate observations for every update interval from 0 through
   * `scenario.durationSec` (inclusive when it lands exactly on an interval).
   */
  generateAll(): Array<{ timestampSec: number; observations: Observation[] }> {
    const interval = this.scenario.sensor.updateIntervalSec;
    const results: Array<{
      timestampSec: number;
      observations: Observation[];
    }> = [];

    // Include t=0 and every interval up to and including durationSec
    const count = Math.floor(this.scenario.durationSec / interval) + 1;

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      results.push({
        timestampSec: t,
        observations: this.generate(t),
      });
    }

    return results;
  }
}

function isContactDropped(
  scenario: Scenario,
  contactId: string,
  timestampSec: number
): boolean {
  return (
    scenario.sensor.contactDropouts?.some(
      (dropout) =>
        dropout.contactId === contactId &&
        timestampSec >= dropout.startSec &&
        timestampSec <= dropout.endSec
    ) ?? false
  );
}
