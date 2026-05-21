import { describe, expect, it } from 'vitest';
import {
  compareEstimateToTruth,
  generateDebrief,
  scoreClassification,
  scoreConfidenceCalibration,
  scoreCourseError,
  scoreRangeError,
  scoreSpeedError,
} from '../../src/scoring/estimateScoring';
import type { Estimate, Scenario } from '../../src/simulation/scenarioTypes';

function makeScenario(overrides?: Partial<Scenario>): Scenario {
  return {
    id: 'test-scenario',
    title: 'Test',
    description: 'Test scenario',
    ownship: {
      position: { x: 0, y: 0 },
      course: 0,
      speed: 5,
    },
    contacts: [
      {
        id: 'C1',
        category: 'submarine',
        position: { x: 1000, y: 1000 },
        course: 90,
        speed: 8,
      },
    ],
    sensor: {
      bearingNoiseDeg: 1,
      updateIntervalSec: 10,
      classificationAmbiguity: 'low',
    },
    environment: { name: 'Test' },
    tasks: [],
    hints: [],
    debriefRules: [],
    durationSec: 120,
    ...overrides,
  };
}

describe('scoreRangeError', () => {
  it('returns 1.0 for exact match', () => {
    expect(scoreRangeError(5000, 5000)).toBeCloseTo(1.0, 6);
  });

  it('drops as error increases', () => {
    expect(scoreRangeError(5000, 10000)).toBeCloseTo(2 / 3, 6);
    expect(scoreRangeError(15000, 10000)).toBeCloseTo(2 / 3, 6);
  });

  it('returns 0 when true range is 0 and estimate is non-zero', () => {
    expect(scoreRangeError(100, 0)).toBe(0);
  });

  it('returns 1 when both are 0', () => {
    expect(scoreRangeError(0, 0)).toBe(1);
  });
});

describe('scoreCourseError', () => {
  it('returns 1.0 for exact match', () => {
    expect(scoreCourseError(45, 45)).toBe(1);
  });

  it('returns 0.5 at 90 degrees difference', () => {
    expect(scoreCourseError(0, 90)).toBe(0.5);
  });

  it('returns 0.0 at 180 degrees difference', () => {
    expect(scoreCourseError(0, 180)).toBe(0);
  });

  it('handles 350° vs 10° correctly (shortest difference 20°)', () => {
    // 20/180 = 0.111..., so score should be ~0.888...
    expect(scoreCourseError(350, 10)).toBeCloseTo(1 - 20 / 180, 6);
    expect(scoreCourseError(10, 350)).toBeCloseTo(1 - 20 / 180, 6);
  });
});

describe('scoreSpeedError', () => {
  it('returns 1.0 for exact match', () => {
    expect(scoreSpeedError(10, 10)).toBeCloseTo(1.0, 6);
  });

  it('drops as error increases', () => {
    expect(scoreSpeedError(10, 20)).toBeCloseTo(2 / 3, 6);
    expect(scoreSpeedError(30, 20)).toBeCloseTo(2 / 3, 6);
  });

  it('returns 0 when true speed is 0 and estimate is non-zero', () => {
    expect(scoreSpeedError(5, 0)).toBe(0);
  });

  it('returns 1 when both are 0', () => {
    expect(scoreSpeedError(0, 0)).toBe(1);
  });
});

describe('scoreClassification', () => {
  it('returns 1.0 for exact match', () => {
    expect(scoreClassification('submarine', 'submarine')).toBe(1);
  });

  it('returns 0.0 for mismatch', () => {
    expect(scoreClassification('merchant', 'submarine')).toBe(0);
  });

  it('returns 0.0 when estimated is undefined', () => {
    expect(scoreClassification(undefined, 'submarine')).toBe(0);
  });
});

describe('scoreConfidenceCalibration', () => {
  it('rewards high confidence when correct', () => {
    const scores = { range: 1, course: 1, speed: 1, classification: 1 };
    expect(scoreConfidenceCalibration('high', scores)).toBe(1);
  });

  it('punishes high confidence when wrong', () => {
    const scores = { range: 0, course: 0, speed: 0, classification: 0 };
    const result = scoreConfidenceCalibration('high', scores);
    expect(result).toBeLessThan(0.5);
    expect(result).toBe(0);
  });

  it('is lenient on low confidence even when wrong', () => {
    const scores = { range: 0, course: 0, speed: 0, classification: 0 };
    expect(scoreConfidenceCalibration('low', scores)).toBeGreaterThan(
      scoreConfidenceCalibration('high', scores)
    );
  });

  it('is lenient on low confidence when mostly right', () => {
    const scores = {
      range: 0.75,
      course: 0.75,
      speed: 0.75,
      classification: 0.75,
    };
    expect(scoreConfidenceCalibration('low', scores)).toBe(1);
  });
});

describe('compareEstimateToTruth', () => {
  it('returns perfect scores for a perfect estimate', () => {
    const scenario = makeScenario();
    const estimate: Estimate = {
      timestampSec: 0,
      contactId: 'C1',
      rangeYds: Math.sqrt(1000 ** 2 + 1000 ** 2),
      course: 90,
      speed: 8,
      classification: 'submarine',
      confidence: 'high',
    };
    const components = compareEstimateToTruth(estimate, scenario, 0);

    expect(components.map((c) => c.value)).toEqual([1, 1, 1, 1]);
  });

  it('handles missing classification gracefully', () => {
    const scenario = makeScenario();
    const estimate: Estimate = {
      timestampSec: 0,
      contactId: 'C1',
      rangeYds: Math.sqrt(1000 ** 2 + 1000 ** 2),
      course: 90,
      speed: 8,
      classification: undefined,
      confidence: 'medium',
    };
    const components = compareEstimateToTruth(estimate, scenario, 0);
    const classificationComponent = components.find(
      (c) => c.metric === 'classification'
    );
    expect(classificationComponent!.value).toBe(0);
  });

  it('returns range error when range is off', () => {
    const scenario = makeScenario();
    const estimate: Estimate = {
      timestampSec: 0,
      contactId: 'C1',
      rangeYds: 5000,
      course: 90,
      speed: 8,
      classification: 'submarine',
      confidence: 'medium',
    };
    const trueRange = Math.sqrt(1000 ** 2 + 1000 ** 2);
    const components = compareEstimateToTruth(estimate, scenario, 0);
    const rangeComponent = components.find((c) => c.metric === 'range');
    expect(rangeComponent!.value).toBeCloseTo(
      scoreRangeError(5000, trueRange),
      6
    );
  });
});

describe('generateDebrief', () => {
  it('returns a valid Debrief object with feedback', () => {
    const scenario = makeScenario({
      debriefRules: [
        {
          metric: 'range',
          threshold: 0.5,
          feedback: 'Work on range estimation.',
        },
      ],
    });
    const estimate: Estimate = {
      timestampSec: 0,
      contactId: 'C1',
      rangeYds: Math.sqrt(1000 ** 2 + 1000 ** 2),
      course: 90,
      speed: 8,
      classification: 'submarine',
      confidence: 'high',
    };
    const debrief = generateDebrief(scenario, [estimate]);

    expect(debrief.scenarioId).toBe(scenario.id);
    expect(debrief.scoreTotal).toBeCloseTo(1, 6);
    expect(debrief.scoreComponents).toHaveLength(4);
    expect(debrief.estimates).toHaveLength(1);
    expect(debrief.truthAtTime).toHaveProperty('C1');
    expect(debrief.feedback.length).toBeGreaterThanOrEqual(0);
  });

  it('applies debrief rules when scores fall below threshold', () => {
    const scenario = makeScenario({
      debriefRules: [
        { metric: 'course', threshold: 0.9, feedback: 'Course needs work.' },
      ],
    });
    const estimate: Estimate = {
      timestampSec: 0,
      contactId: 'C1',
      rangeYds: Math.sqrt(1000 ** 2 + 1000 ** 2),
      course: 180, //_truth is 90, huge error
      speed: 8,
      classification: 'submarine',
      confidence: 'high',
    };
    const debrief = generateDebrief(scenario, [estimate]);
    expect(debrief.feedback).toContain('Course needs work.');
  });

  it('flags contacts with no estimates', () => {
    const scenario = makeScenario({
      contacts: [
        {
          id: 'C1',
          category: 'submarine',
          position: { x: 1000, y: 1000 },
          course: 90,
          speed: 8,
        },
        {
          id: 'C2',
          category: 'merchant',
          position: { x: 2000, y: 2000 },
          course: 0,
          speed: 12,
        },
      ],
    });
    const estimate: Estimate = {
      timestampSec: 0,
      contactId: 'C1',
      rangeYds: Math.sqrt(1000 ** 2 + 1000 ** 2),
      course: 90,
      speed: 8,
      classification: 'submarine',
      confidence: 'high',
    };
    const debrief = generateDebrief(scenario, [estimate]);
    expect(debrief.feedback.some((f) => f.includes('C2'))).toBe(true);
  });

  it('produces empty score and feedback when no estimates given', () => {
    const scenario = makeScenario();
    const debrief = generateDebrief(scenario, []);
    expect(debrief.scoreTotal).toBe(0);
    expect(debrief.scoreComponents).toHaveLength(0);
    expect(debrief.feedback.some((f) => f.includes('C1'))).toBe(true);
  });

  it('computes evolving truth states when timestamps differ', () => {
    const scenario = makeScenario();
    const estimate: Estimate = {
      timestampSec: 60,
      contactId: 'C1',
      rangeYds: 2000, // intentionally wrong
      course: 90,
      speed: 8,
      classification: 'submarine',
      confidence: 'medium',
    };
    const components = compareEstimateToTruth(estimate, scenario, 60);
    const rangeComponent = components.find((c) => c.metric === 'range');
    expect(rangeComponent!.value).toBeLessThan(1);
  });
});
