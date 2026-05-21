import type { ContactCategory, Scenario } from './scenarioTypes';
import { SeededRandom } from './observations';

/**
 * Fictional sonar signature categories for game/simulation classification.
 * These are intentionally abstract and do not map to real-world acoustic data.
 */
export const SIGNATURE_CATEGORIES: string[] = [
  'whisper-class',
  'hammer-class',
  'wave-class',
  'pulse-class',
  'drum-class',
  'ghost-class',
  'broadband-hum',
  'narrowband-tone',
  'intermittent-click',
  'steady-thrum',
];

const CONTACT_CATEGORIES: ContactCategory[] = [
  'merchant',
  'submarine',
  'surface-combatant',
  'biologic',
  'unknown',
];

/**
 * Ambiguous cue qualities. Lower clarity = more ambiguous.
 */
export type CueClarity = 'clear' | 'fuzzy' | 'garbled';

/**
 * A generated sonar cue for a contact at a moment in time.
 */
export interface SonarCue {
  contactId: string;
  timestampSec: number;
  signatureCategory: string;
  clarity: CueClarity;
  confidenceBoost: number; // additive modifier for classification confidence
  transientNote?: string;
}

/**
 * Generate a sonar cue for a contact.
 *
 * @param contactId   The contact ID.
 * @param category    The contact's true category.
 * @param signature   Optional predefined signature from the scenario.
 * @param ambiguity   Sensor ambiguity setting.
 * @param seed        Deterministic seed string.
 * @param timestampSec Simulated time.
 */
export function generateSonarCue(
  contactId: string,
  category: ContactCategory,
  signature: string | undefined,
  ambiguity: Scenario['sensor']['classificationAmbiguity'],
  seed: string,
  timestampSec: number
): SonarCue {
  const rng = new SeededRandom(`${seed}:sonar:${contactId}:${timestampSec}`);

  // Signature category: predefined if available, otherwise randomized
  const sigPool = getSignaturesForCategory(category);
  const baseSignature =
    signature ?? sigPool[Math.floor(rng.range(0, sigPool.length))];

  // Ambiguity affects clarity
  const clarityRoll = rng.range(0, 1);
  let clarity: CueClarity;
  let confidenceBoost: number;

  switch (ambiguity) {
    case 'low':
      clarity =
        clarityRoll < 0.8 ? 'clear' : clarityRoll < 0.95 ? 'fuzzy' : 'garbled';
      confidenceBoost =
        clarity === 'clear' ? +0.3 : clarity === 'fuzzy' ? 0 : -0.2;
      break;
    case 'medium':
      clarity =
        clarityRoll < 0.4 ? 'clear' : clarityRoll < 0.8 ? 'fuzzy' : 'garbled';
      confidenceBoost =
        clarity === 'clear' ? +0.2 : clarity === 'fuzzy' ? 0 : -0.3;
      break;
    case 'high':
      clarity =
        clarityRoll < 0.15 ? 'clear' : clarityRoll < 0.5 ? 'fuzzy' : 'garbled';
      confidenceBoost =
        clarity === 'clear' ? +0.1 : clarity === 'fuzzy' ? -0.1 : -0.4;
      break;
  }

  // Transient event: occasional speed/course change hint
  let transientNote: string | undefined;
  if (rng.range(0, 1) < 0.1) {
    const events = [
      'speed change detected',
      'course change detected',
      'intermittent cavitation',
      'machinery noise shift',
    ];
    transientNote = events[Math.floor(rng.range(0, events.length))];
  }

  return {
    contactId,
    timestampSec,
    signatureCategory: baseSignature,
    clarity,
    confidenceBoost,
    transientNote,
  };
}

/**
 * Score a classification estimate with confidence calibration.
 *
 * @param estimatedCategory  User's guess.
 * @param estimatedConfidence User's confidence level.
 * @param truthCategory      True category.
 * @param sonarCue           The cue that was shown.
 */
export function scoreClassify(
  estimatedCategory: string | undefined,
  estimatedConfidence: 'low' | 'medium' | 'high',
  truthCategory: ContactCategory,
  sonarCue: SonarCue
): number {
  if (!estimatedCategory) return 0;

  const isCorrect =
    estimatedCategory === truthCategory ||
    isCategoryMatch(estimatedCategory, truthCategory, sonarCue.clarity);

  const confidenceMultiplier = {
    low: 0.8,
    medium: 1.0,
    high: 1.2,
  }[estimatedConfidence];

  if (isCorrect) {
    return Math.min(1.0, confidenceMultiplier);
  } else {
    // Penalize overconfidence when wrong
    return Math.max(0, 0.0 - (confidenceMultiplier - 1.0));
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

function getSignaturesForCategory(category: ContactCategory): string[] {
  // Fictionally map categories to plausible signature families
  switch (category) {
    case 'submarine':
      return [
        'whisper-class',
        'ghost-class',
        'intermittent-click',
        'narrowband-tone',
      ];
    case 'merchant':
      return ['broadband-hum', 'steady-thrum', 'pulse-class'];
    case 'surface-combatant':
      return ['hammer-class', 'drum-class', 'wave-class', 'pulse-class'];
    case 'biologic':
      return ['intermittent-click', 'broadband-hum', 'ghost-class'];
    case 'unknown':
    default:
      return SIGNATURE_CATEGORIES;
  }
}

/**
 * When the cue is garbled, allow "close enough" matches
 * within the same fictional signature family.
 */
function isCategoryMatch(
  estimate: string,
  truth: ContactCategory,
  clarity: CueClarity
): boolean {
  if (clarity !== 'garbled') return estimate === truth;

  // When garbled, accept a signature in the right family or a category whose
  // signature family overlaps the truth category.
  const truthFamily = getSignaturesForCategory(truth);
  if (truthFamily.includes(estimate)) return true;

  if (
    !isContactCategory(estimate) ||
    estimate === 'unknown' ||
    truth === 'unknown'
  ) {
    return false;
  }

  return getSignaturesForCategory(estimate).some((signature) =>
    truthFamily.includes(signature)
  );
}

function isContactCategory(value: string): value is ContactCategory {
  return CONTACT_CATEGORIES.includes(value as ContactCategory);
}

/**
 * Get a display label for a sonar cue clarity.
 */
export function clarityLabel(clarity: CueClarity): string {
  switch (clarity) {
    case 'clear':
      return 'Clear signal';
    case 'fuzzy':
      return 'Fuzzy match';
    case 'garbled':
      return 'Garbled — ambiguous';
  }
}
