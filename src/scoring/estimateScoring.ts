import type {
  ContactCategory,
  Debrief,
  DebriefScoreComponent,
  Estimate,
  Scenario,
} from '../simulation/scenarioTypes';
import { bearingDifference, distanceBetween } from '../simulation/geometry';
import { computeEntityState } from '../simulation/tracks';

const DEFAULT_WEIGHTS = {
  range: 0.3,
  course: 0.3,
  speed: 0.3,
  classification: 0.1,
} as const;

/**
 * Score a range estimate relative to truth.
 * Uses relative error mapped to [0, 1] via 1 / (1 + relativeError).
 */
export function scoreRangeError(estimatedYds: number, trueYds: number): number {
  if (trueYds === 0) {
    return estimatedYds === 0 ? 1.0 : 0.0;
  }
  const relativeError = Math.abs(estimatedYds - trueYds) / trueYds;
  return 1 / (1 + relativeError);
}

/**
 * Score a course estimate relative to truth.
 * Uses bearingDifference to handle 0/360 wrap-around.
 * Linear fall-off: 0° diff = 1.0, 180° diff = 0.0.
 */
export function scoreCourseError(
  estimatedDeg: number,
  trueDeg: number
): number {
  const diff = bearingDifference(estimatedDeg, trueDeg);
  return Math.max(0, 1 - diff / 180);
}

/**
 * Score a speed estimate relative to truth.
 * Uses relative error mapped to [0, 1] via 1 / (1 + relativeError).
 */
export function scoreSpeedError(estimatedKts: number, trueKts: number): number {
  if (trueKts === 0) {
    return estimatedKts === 0 ? 1.0 : 0.0;
  }
  const relativeError = Math.abs(estimatedKts - trueKts) / trueKts;
  return 1 / (1 + relativeError);
}

/**
 * Score a classification estimate against truth.
 * Returns 1.0 for exact match, 0.0 otherwise (including undefined).
 */
export function scoreClassification(
  estimated: ContactCategory | undefined,
  truth: ContactCategory
): number {
  return estimated === truth ? 1.0 : 0.0;
}

/**
 * Confidence numeric mapping.
 */
const CONFIDENCE_NUMERIC: Record<string, number> = {
  low: 1 / 3,
  medium: 2 / 3,
  high: 1.0,
};

/**
 * Score how well-calibrated the user's confidence is given their actual errors.
 * Rewards high confidence when accurate; penalizes high confidence when wrong.
 * Uncertainty when wrong incurs only a small penalty.
 */
export function scoreConfidenceCalibration(
  estimatedConfidence: string,
  errorScores: {
    range: number;
    course: number;
    speed: number;
    classification: number;
  }
): number {
  const confidenceLevel = CONFIDENCE_NUMERIC[estimatedConfidence] ?? 0.5;
  const avgScore =
    (errorScores.range +
      errorScores.course +
      errorScores.speed +
      errorScores.classification) /
    4;
  return Math.max(0, 1 - Math.max(0, confidenceLevel - avgScore));
}

/**
 * Compare a single estimate against the scenario truth at the given timestamp.
 * Returns weighted score components for range, course, speed, and classification.
 */
export function compareEstimateToTruth(
  estimate: Estimate,
  scenario: Scenario,
  timestampSec: number
): DebriefScoreComponent[] {
  const contact = scenario.contacts.find((c) => c.id === estimate.contactId);
  if (!contact) {
    return [];
  }

  const ownshipState = computeEntityState(scenario.ownship, timestampSec);
  const contactState = computeEntityState(contact, timestampSec);

  const trueRange = distanceBetween(
    ownshipState.position,
    contactState.position
  );

  const rangeScore = scoreRangeError(estimate.rangeYds, trueRange);
  const courseScore = scoreCourseError(estimate.course, contactState.course);
  const speedScore = scoreSpeedError(estimate.speed, contactState.speed);
  const classificationScore = scoreClassification(
    estimate.classification,
    contact.category
  );

  return [
    { metric: 'range', value: rangeScore, weight: DEFAULT_WEIGHTS.range },
    { metric: 'course', value: courseScore, weight: DEFAULT_WEIGHTS.course },
    { metric: 'speed', value: speedScore, weight: DEFAULT_WEIGHTS.speed },
    {
      metric: 'classification',
      value: classificationScore,
      weight: DEFAULT_WEIGHTS.classification,
    },
  ];
}

/**
 * Aggregate metric averages from per-estimate components.
 */
function aggregateScores(
  allComponents: DebriefScoreComponent[]
): DebriefScoreComponent[] {
  const buckets: Record<
    string,
    { total: number; count: number; weight: number }
  > = {};

  for (const comp of allComponents) {
    if (!buckets[comp.metric]) {
      buckets[comp.metric] = { total: 0, count: 0, weight: comp.weight };
    }
    buckets[comp.metric].total += comp.value;
    buckets[comp.metric].count += 1;
  }

  return Object.entries(buckets).map(([metric, data]) => ({
    metric,
    value: data.total / data.count,
    weight: data.weight,
  }));
}

/**
 * Build a synthetic Contact snapshot from an EntityState. Reuses the
 * original contact's id and category.
 */
function stateToContact(
  base: Required<Pick<Scenario, 'contacts'>>['contacts'][number],
  state: ReturnType<typeof computeEntityState>
): Required<Pick<Scenario, 'contacts'>>['contacts'][number] {
  return {
    ...base,
    position: { ...state.position },
    course: state.course,
    speed: state.speed,
  };
}

/**
 * Generate a full Debrief by comparing every estimate to truth,
 * aggregating scores, applying DebriefRules, and generating feedback.
 */
export function generateDebrief(
  scenario: Scenario,
  estimates: Estimate[]
): Debrief {
  const nowSec = Date.now() / 1000;
  const allComponents: DebriefScoreComponent[] = [];
  const truthAtTime: Debrief['truthAtTime'] = {};
  const errorHistory: Debrief['errorHistory'] = {};
  const feedback: string[] = [];
  const estimatedContactIds = new Set<string>();

  for (const estimate of estimates) {
    estimatedContactIds.add(estimate.contactId);

    const components = compareEstimateToTruth(
      estimate,
      scenario,
      estimate.timestampSec
    );
    allComponents.push(...components);

    const contact = scenario.contacts.find((c) => c.id === estimate.contactId);
    if (contact) {
      const state = computeEntityState(contact, estimate.timestampSec);
      truthAtTime[estimate.contactId] = stateToContact(contact, state);

      const rangeComp = components.find((c) => c.metric === 'range');
      if (rangeComp) {
        if (!errorHistory[estimate.contactId]) {
          errorHistory[estimate.contactId] = [];
        }
        errorHistory[estimate.contactId].push(1 - rangeComp.value);
      }
    }
  }

  const scoreComponents = aggregateScores(allComponents);

  let scoreTotal = 0;
  let totalWeight = 0;
  for (const comp of scoreComponents) {
    scoreTotal += comp.value * comp.weight;
    totalWeight += comp.weight;
  }
  if (totalWeight > 0) {
    scoreTotal = scoreTotal / totalWeight;
  } else {
    scoreTotal = 0;
  }

  // Apply debrief rules against aggregated metrics
  for (const rule of scenario.debriefRules) {
    if (rule.metric === 'total') {
      if (scoreTotal < rule.threshold) {
        feedback.push(rule.feedback);
      }
      continue;
    }
    const metricComp = scoreComponents.find((c) => c.metric === rule.metric);
    if (metricComp && metricComp.value < rule.threshold) {
      feedback.push(rule.feedback);
    }
  }

  // Fallback positive feedback
  if (feedback.length === 0 && estimates.length > 0) {
    feedback.push(
      'Good job! Your estimates were well-calibrated and accurate.'
    );
  }

  // Flag contacts with no estimates
  for (const contact of scenario.contacts) {
    if (!estimatedContactIds.has(contact.id)) {
      feedback.push(`No estimate submitted for contact ${contact.id}.`);
    }
  }

  return {
    scenarioId: scenario.id,
    timestampSec: nowSec,
    scoreTotal,
    scoreComponents,
    estimates,
    truthAtTime,
    feedback,
    errorHistory,
  };
}
