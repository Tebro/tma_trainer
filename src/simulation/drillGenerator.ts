import type { Contact, Ownship, Scenario } from './scenarioTypes';
import { SeededRandom } from './observations';

export type DrillTemplate =
  | 'constant-bearing'
  | 'crossing'
  | 'opening'
  | 'closing'
  | 'two-contact-classification'
  | 'high-noise-bearing-only'
  | 'maneuver-timing'
  | 'rapid-estimate'
  | 'lost-contact-reacquire';

export type DrillDifficulty = 'intro' | 'easy' | 'normal' | 'hard';

const TEMPLATE_IDS: DrillTemplate[] = [
  'constant-bearing',
  'crossing',
  'opening',
  'closing',
  'two-contact-classification',
  'high-noise-bearing-only',
  'maneuver-timing',
  'rapid-estimate',
  'lost-contact-reacquire',
];

const DIFFICULTY_NOISE: Record<DrillDifficulty, number> = {
  intro: 1.0,
  easy: 1.5,
  normal: 2.5,
  hard: 4.0,
};

const DIFFICULTY_INTERVAL: Record<DrillDifficulty, number> = {
  intro: 20,
  easy: 25,
  normal: 30,
  hard: 40,
};

const DIFFICULTY_AMBIGUITY: Record<DrillDifficulty, 'low' | 'medium' | 'high'> =
  {
    intro: 'low',
    easy: 'low',
    normal: 'medium',
    hard: 'high',
  };

/**
 * Generate a randomized drill scenario from a template.
 *
 * Same (template, difficulty, seed) always produces the same scenario.
 */
export function generateDrill(
  template: DrillTemplate,
  difficulty: DrillDifficulty,
  seed: string
): Scenario {
  const rng = new SeededRandom(seed);

  const base = buildBaseScenario(seed, difficulty, rng);

  switch (template) {
    case 'constant-bearing':
      return buildConstantBearing(base, rng);
    case 'crossing':
      return buildCrossing(base, rng);
    case 'opening':
      return buildOpening(base, rng);
    case 'closing':
      return buildClosing(base, rng);
    case 'two-contact-classification':
      return buildTwoContactClassification(base, rng);
    case 'high-noise-bearing-only':
      return buildHighNoiseBearingOnly(base, rng);
    case 'maneuver-timing':
      return buildManeuverTiming(base, rng);
    case 'rapid-estimate':
      return buildRapidEstimate(base, rng);
    case 'lost-contact-reacquire':
      return buildLostContactReacquire(base, rng);
    default:
      // Exhaustive check; should never reach
      return base;
  }
}

/** List available drill templates. */
export function getDrillTemplateIds(): DrillTemplate[] {
  return [...TEMPLATE_IDS];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildBaseScenario(
  seed: string,
  difficulty: DrillDifficulty,
  rng: SeededRandom
): Scenario {
  const id = `drill-${seed}`;
  const title = 'Practice Drill';
  const durationSec = 300; // 5 minutes

  const ownship: Ownship = {
    position: { x: 0, y: 0 },
    course: normalizeCourse(rng.range(0, 360)),
    speed: Math.round(rng.range(6, 12)),
  };

  return {
    id,
    title,
    ownship,
    contacts: [],
    sensor: {
      bearingNoiseDeg: DIFFICULTY_NOISE[difficulty],
      updateIntervalSec: DIFFICULTY_INTERVAL[difficulty],
      classificationAmbiguity: DIFFICULTY_AMBIGUITY[difficulty],
    },
    environment: {},
    tasks: [],
    hints: [],
    debriefRules: [
      {
        metric: 'range',
        threshold: 0.4,
        feedback:
          'Range estimation was off. Try triangulating from multiple bearing lines.',
      },
      {
        metric: 'course',
        threshold: 0.5,
        feedback:
          'Course estimate needs work. Watch how the bearing drifts over time.',
      },
      {
        metric: 'speed',
        threshold: 0.4,
        feedback:
          'Speed estimation was challenging. Observe bearing rate changes.',
      },
    ],
    durationSec,
  };
}

/** Place a contact at a random position within min/max range from ownship. */
function randomContactPosition(
  rng: SeededRandom,
  minRange: number,
  maxRange: number
): { x: number; y: number } {
  const range = rng.range(minRange, maxRange);
  const bearing = rng.range(0, 360);
  const rad = (bearing * Math.PI) / 180;
  return {
    x: range * Math.sin(rad),
    y: range * Math.cos(rad),
  };
}

/** Pick a random contact category. */
function randomCategory(
  rng: SeededRandom
): 'merchant' | 'submarine' | 'surface-combatant' | 'biologic' | 'unknown' {
  const categories: Array<
    'merchant' | 'submarine' | 'surface-combatant' | 'biologic' | 'unknown'
  > = ['merchant', 'submarine', 'surface-combatant', 'biologic', 'unknown'];
  const idx = Math.floor(rng.range(0, categories.length));
  return categories[idx];
}

// ── Drill Templates ─────────────────────────────────────────────────────────

/** Contact on roughly constant bearing (near collision or parallel). */
function buildConstantBearing(base: Scenario, rng: SeededRandom): Scenario {
  const pos = randomContactPosition(rng, 4000, 10000);

  // Course roughly parallel to ownship with small offset
  const courseOffset = rng.range(-20, 20);
  const course = base.ownship.course + courseOffset;

  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'submarine',
    position: pos,
    course: normalizeCourse(course),
    speed: Math.round(rng.range(4, 12)),
  };

  return {
    ...base,
    id: `${base.id}-constant-bearing`,
    title: 'Constant Bearing Drill',
    contacts: [contact],
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'total',
        threshold: 0.5,
        feedback:
          'Constant-bearing situations are deceptive: the contact is near a collision course with you. Range closes quickly even though the bearing barely changes.',
      },
    ],
  };
}

/** Contact crossing ownship's track at a significant angle. */
function buildCrossing(base: Scenario, rng: SeededRandom): Scenario {
  const pos = randomContactPosition(rng, 5000, 12000);

  // Course perpendicular-ish to ownship.
  const crossingSide = rng.range(0, 1) > 0.5 ? 1 : -1;
  const course = base.ownship.course + crossingSide * rng.range(60, 120);

  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'surface-combatant',
    position: pos,
    course: normalizeCourse(course),
    speed: Math.round(rng.range(6, 15)),
  };

  return {
    ...base,
    id: `${base.id}-crossing`,
    title: 'Crossing Contact Drill',
    contacts: [contact],
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'total',
        threshold: 0.5,
        feedback:
          'Crossing contacts show the fastest bearing rate when they pass closest to your beam. Use this to triangulate range.',
      },
    ],
  };
}

/** Contact moving away from ownship (opening). */
function buildOpening(base: Scenario, rng: SeededRandom): Scenario {
  const pos = randomContactPosition(rng, 3000, 8000);

  // Course roughly same direction as ownship but faster → pulling ahead
  const course = base.ownship.course + rng.range(-20, 20);
  const speed = Math.round(
    rng.range(base.ownship.speed + 2, base.ownship.speed + 10)
  );

  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'merchant',
    position: pos,
    course: normalizeCourse(course),
    speed,
  };

  return {
    ...base,
    id: `${base.id}-opening`,
    title: 'Opening Contact Drill',
    contacts: [contact],
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'total',
        threshold: 0.5,
        feedback:
          'Opening contacts show steady bearing drift away from the initial line. The rate slows as range increases.',
      },
    ],
  };
}

/** Contact moving toward ownship (closing). */
function buildClosing(base: Scenario, rng: SeededRandom): Scenario {
  const pos = randomContactPosition(rng, 6000, 15000);

  // Course roughly opposite ownship, yielding a closing geometry.
  const course = base.ownship.course + 180 + rng.range(-20, 20);
  const speed = Math.round(rng.range(6, 14));

  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'submarine',
    position: pos,
    course: normalizeCourse(course),
    speed,
  };

  return {
    ...base,
    id: `${base.id}-closing`,
    title: 'Closing Contact Drill',
    contacts: [contact],
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'total',
        threshold: 0.5,
        feedback:
          'Closing contacts show increasing signal strength and faster apparent motion. Estimate quickly before they pass.',
      },
    ],
  };
}

/** Two contacts with different signatures for classification practice. */
function buildTwoContactClassification(
  base: Scenario,
  rng: SeededRandom
): Scenario {
  const pos1 = randomContactPosition(rng, 5000, 10000);
  const pos2 = randomContactPosition(rng, 6000, 12000);

  const contact1: Contact = {
    id: 'CONTACT-1',
    category: randomCategory(rng),
    position: pos1,
    course: normalizeCourse(rng.range(0, 360)),
    speed: Math.round(rng.range(4, 14)),
    signature: pickSignature(rng),
  };

  const contact2: Contact = {
    id: 'CONTACT-2',
    category: randomCategory(rng),
    position: pos2,
    course: normalizeCourse(rng.range(0, 360)),
    speed: Math.round(rng.range(4, 14)),
    signature: pickSignature(rng),
  };

  return {
    ...base,
    id: `${base.id}-two-contact`,
    title: 'Two-Contact Classification Drill',
    contacts: [contact1, contact2],
    durationSec: 360, // Slightly longer for two contacts
    sensor: {
      ...base.sensor,
      updateIntervalSec: 25, // Faster updates for two contacts
    },
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'classification',
        threshold: 0.5,
        feedback:
          'With two contacts, signature cues become critical. Compare signal characteristics and confidence levels.',
      },
    ],
  };
}

function buildHighNoiseBearingOnly(
  base: Scenario,
  rng: SeededRandom
): Scenario {
  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'unknown',
    position: randomContactPosition(rng, 7000, 16000),
    course: normalizeCourse(rng.range(0, 360)),
    speed: Math.round(rng.range(5, 14)),
  };

  return {
    ...base,
    id: `${base.id}-high-noise-bearing-only`,
    title: 'High-Noise Bearing-Only Drill',
    description:
      'Work from sparse, noisy bearing-only observations. Estimate the trend, not each individual line.',
    contacts: [contact],
    durationSec: 420,
    sensor: {
      ...base.sensor,
      bearingNoiseDeg: Math.max(base.sensor.bearingNoiseDeg * 2.5, 6),
      updateIntervalSec: Math.max(base.sensor.updateIntervalSec, 35),
      classificationAmbiguity: 'high',
    },
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'range',
        threshold: 0.45,
        feedback:
          'High-noise drills reward trend estimation. Do not chase each individual noisy bearing.',
      },
    ],
  };
}

function buildManeuverTiming(base: Scenario, rng: SeededRandom): Scenario {
  const side = rng.range(0, 1) > 0.5 ? 1 : -1;
  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'submarine',
    position: randomContactPosition(rng, 6000, 12000),
    course: normalizeCourse(base.ownship.course + side * rng.range(20, 45)),
    speed: Math.round(rng.range(6, 12)),
  };

  return {
    ...base,
    id: `${base.id}-maneuver-timing`,
    title: 'Maneuver Timing Drill',
    description:
      'Decide when to maneuver ownship to create useful bearing-rate change.',
    contacts: [contact],
    durationSec: 480,
    sensor: {
      ...base.sensor,
      updateIntervalSec: Math.min(base.sensor.updateIntervalSec, 20),
    },
    tasks: [
      {
        id: 'initial-estimate',
        title: 'Initial Estimate',
        description:
          'Build an initial solution before changing ownship course.',
      },
      {
        id: 'execute-maneuver',
        title: 'Time the Maneuver',
        description:
          'Use the maneuver controls when the bearing history suggests geometry is weak.',
      },
      {
        id: 'refined-estimate',
        title: 'Refined Estimate',
        description: 'Submit a refined estimate after the bearing fan changes.',
      },
    ],
    hints: [
      {
        id: 'maneuver-hint-1',
        taskId: 'execute-maneuver',
        text: 'A turn that creates a larger bearing-rate change usually improves the solution.',
        revealAfterSec: 120,
      },
    ],
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'course',
        threshold: 0.55,
        feedback:
          'The maneuver should help separate course and range ambiguity. Compare your pre- and post-maneuver assumptions.',
      },
    ],
  };
}

function buildRapidEstimate(base: Scenario, rng: SeededRandom): Scenario {
  const contact: Contact = {
    id: 'CONTACT-1',
    category: randomCategory(rng),
    position: randomContactPosition(rng, 3000, 9000),
    course: normalizeCourse(rng.range(0, 360)),
    speed: Math.round(rng.range(8, 18)),
    signature: pickSignature(rng),
  };

  return {
    ...base,
    id: `${base.id}-rapid-estimate`,
    title: 'Rapid Estimate Drill',
    description:
      'Short drill focused on producing a useful first estimate quickly.',
    contacts: [contact],
    durationSec: 120,
    sensor: {
      ...base.sensor,
      updateIntervalSec: 10,
      bearingNoiseDeg: Math.max(base.sensor.bearingNoiseDeg, 2),
    },
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'total',
        threshold: 0.55,
        feedback:
          'Rapid estimates require a practical first solution, not a perfect one. Use the first few bearings decisively.',
      },
    ],
  };
}

function buildLostContactReacquire(
  base: Scenario,
  rng: SeededRandom
): Scenario {
  const contact: Contact = {
    id: 'CONTACT-1',
    category: 'submarine',
    position: randomContactPosition(rng, 6000, 13000),
    course: normalizeCourse(rng.range(0, 360)),
    speed: Math.round(rng.range(5, 12)),
    maneuvers: [
      {
        timeSec: 180,
        course: normalizeCourse(rng.range(0, 360)),
      },
    ],
  };

  return {
    ...base,
    id: `${base.id}-lost-contact-reacquire`,
    title: 'Lost Contact / Reacquire Drill',
    description:
      'Maintain a predicted solution through a temporary loss of observations, then reacquire.',
    contacts: [contact],
    durationSec: 420,
    sensor: {
      ...base.sensor,
      updateIntervalSec: 20,
      contactDropouts: [
        {
          contactId: 'CONTACT-1',
          startSec: 140,
          endSec: 240,
        },
      ],
    },
    debriefRules: [
      ...base.debriefRules,
      {
        metric: 'range',
        threshold: 0.45,
        feedback:
          'During contact loss, dead-reckon the likely motion and use reacquired bearings to correct the prediction.',
      },
    ],
  };
}

function normalizeCourse(c: number): number {
  return ((c % 360) + 360) % 360;
}

const SIGNATURE_POOL = [
  'whisper-class',
  'hammer-class',
  'wave-class',
  'pulse-class',
  'drum-class',
  'ghost-class',
];

function pickSignature(rng: SeededRandom): string {
  const idx = Math.floor(rng.range(0, SIGNATURE_POOL.length));
  return SIGNATURE_POOL[idx];
}
