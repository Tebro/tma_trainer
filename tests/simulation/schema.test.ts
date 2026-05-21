import { describe, expect, it } from 'vitest';
import { validateScenario } from '../../src/simulation/scenarioValidation';
import { validateLesson } from '../../src/lessons/lessonValidation';
import placeholderScenario from '../../content/scenarios/placeholder.json';
import placeholderLesson from '../../content/lessons/placeholder.json';

describe('Scenario schema validation', () => {
  it('accepts the placeholder scenario as valid', () => {
    const result = validateScenario(placeholderScenario);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an empty object with useful errors', () => {
    const result = validateScenario({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('id must be a non-empty string');
    expect(result.errors).toContain('title must be a non-empty string');
  });

  it('rejects invalid numeric ranges', () => {
    const badScenario = {
      id: 'test',
      title: 'Test',
      ownship: {
        position: { x: 0, y: 0 },
        course: 400,
        speed: -1,
      },
      contacts: [],
      sensor: {
        bearingNoiseDeg: -1,
        updateIntervalSec: 0,
        classificationAmbiguity: 'invalid',
      },
      tasks: [],
      hints: [],
      debriefRules: [],
      durationSec: 0,
    };
    const result = validateScenario(badScenario);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('course'))).toBe(true);
    expect(result.errors.some((e) => e.includes('speed'))).toBe(true);
    expect(result.errors.some((e) => e.includes('bearingNoiseDeg'))).toBe(true);
    expect(result.errors.some((e) => e.includes('updateIntervalSec'))).toBe(
      true
    );
    expect(
      result.errors.some((e) => e.includes('classificationAmbiguity'))
    ).toBe(true);
    expect(result.errors.some((e) => e.includes('durationSec'))).toBe(true);
  });

  it('includes ownship, contacts, sensor settings, tasks, hints, and debrief rules fields', () => {
    const result = validateScenario(placeholderScenario);
    expect(result.valid).toBe(true);
    expect(placeholderScenario.ownship).toBeDefined();
    expect(Array.isArray(placeholderScenario.contacts)).toBe(true);
    expect(placeholderScenario.sensor).toBeDefined();
    expect(Array.isArray(placeholderScenario.tasks)).toBe(true);
    expect(Array.isArray(placeholderScenario.hints)).toBe(true);
    expect(Array.isArray(placeholderScenario.debriefRules)).toBe(true);
  });

  it('accepts valid contact dropout windows', () => {
    const result = validateScenario({
      ...placeholderScenario,
      sensor: {
        ...placeholderScenario.sensor,
        contactDropouts: [{ contactId: 'CONTACT-1', startSec: 20, endSec: 60 }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid contact dropout windows', () => {
    const result = validateScenario({
      ...placeholderScenario,
      sensor: {
        ...placeholderScenario.sensor,
        contactDropouts: [{ contactId: '', startSec: 60, endSec: 20 }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('contactDropouts'))).toBe(true);
  });
});

describe('Lesson schema validation', () => {
  it('accepts the placeholder lesson as valid', () => {
    const result = validateLesson(placeholderLesson);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an empty object with useful errors', () => {
    const result = validateLesson({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('id must be a non-empty string');
    expect(result.errors).toContain('title must be a non-empty string');
  });

  it('rejects invalid difficulty', () => {
    const badLesson = {
      id: 'test',
      title: 'Test',
      difficulty: 'impossible',
      objectives: [],
      initialConditions: {
        ownship: {
          position: { x: 0, y: 0 },
          course: 0,
          speed: 0,
        },
        contacts: [],
      },
      sensor: {
        bearingNoiseDeg: 1,
        updateIntervalSec: 10,
        classificationAmbiguity: 'low',
      },
      tasks: [],
      hints: [],
      debriefRules: [],
    };
    const result = validateLesson(badLesson);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('difficulty'))).toBe(true);
  });

  it('includes ownship, contacts, sensor settings, tasks, hints, and debrief rules fields', () => {
    const result = validateLesson(placeholderLesson);
    expect(result.valid).toBe(true);
    expect(placeholderLesson.initialConditions.ownship).toBeDefined();
    expect(Array.isArray(placeholderLesson.initialConditions.contacts)).toBe(
      true
    );
    expect(placeholderLesson.sensor).toBeDefined();
    expect(Array.isArray(placeholderLesson.tasks)).toBe(true);
    expect(Array.isArray(placeholderLesson.hints)).toBe(true);
    expect(Array.isArray(placeholderLesson.debriefRules)).toBe(true);
  });
});
