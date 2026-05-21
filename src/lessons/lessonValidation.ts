import type { Difficulty } from './schema';
import {
  validateOwnship,
  validateContact,
  validateSensorSettings,
} from '../simulation/scenarioValidation';

const VALID_DIFFICULTY: Difficulty[] = ['intro', 'easy', 'normal', 'hard'];

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

function validateLessonTask(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const t = obj as Record<string, unknown>;
  if (!isString(t.id) || t.id.length === 0) {
    errors.push(`${path}.id must be a non-empty string`);
  }
  if (!isString(t.title) || t.title.length === 0) {
    errors.push(`${path}.title must be a non-empty string`);
  }
  if (!isString(t.description)) {
    errors.push(`${path}.description must be a string`);
  }
  if (
    t.requiresEstimate !== undefined &&
    typeof t.requiresEstimate !== 'boolean'
  ) {
    errors.push(`${path}.requiresEstimate must be a boolean if provided`);
  }
  if (
    t.requiresManeuver !== undefined &&
    typeof t.requiresManeuver !== 'boolean'
  ) {
    errors.push(`${path}.requiresManeuver must be a boolean if provided`);
  }
  return errors;
}

function validateLessonHint(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const h = obj as Record<string, unknown>;
  if (!isString(h.id) || h.id.length === 0) {
    errors.push(`${path}.id must be a non-empty string`);
  }
  if (h.taskId !== undefined && !isString(h.taskId)) {
    errors.push(`${path}.taskId must be a string if provided`);
  }
  if (!isString(h.text) || h.text.length === 0) {
    errors.push(`${path}.text must be a non-empty string`);
  }
  if (
    h.revealAfterSec !== undefined &&
    (!isNumber(h.revealAfterSec) || h.revealAfterSec < 0)
  ) {
    errors.push(`${path}.revealAfterSec must be a non-negative number`);
  }
  if (
    h.revealOnFailure !== undefined &&
    typeof h.revealOnFailure !== 'boolean'
  ) {
    errors.push(`${path}.revealOnFailure must be a boolean if provided`);
  }
  return errors;
}

function validateDebriefRule(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const d = obj as Record<string, unknown>;
  if (!isString(d.metric) || d.metric.length === 0) {
    errors.push(`${path}.metric must be a non-empty string`);
  }
  if (!isNumber(d.threshold)) {
    errors.push(`${path}.threshold must be a number`);
  }
  if (!isString(d.feedback) || d.feedback.length === 0) {
    errors.push(`${path}.feedback must be a non-empty string`);
  }
  return errors;
}

export function validateLesson(obj: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isObject(obj)) {
    return { valid: false, errors: ['Input must be an object'] };
  }

  const l = obj as Record<string, unknown>;

  if (!isString(l.id) || l.id.length === 0) {
    errors.push('id must be a non-empty string');
  }
  if (!isString(l.title) || l.title.length === 0) {
    errors.push('title must be a non-empty string');
  }
  if (l.summary !== undefined && !isString(l.summary)) {
    errors.push('summary must be a string if provided');
  }
  if (
    !isString(l.difficulty) ||
    !VALID_DIFFICULTY.includes(l.difficulty as Difficulty)
  ) {
    errors.push(`difficulty must be one of ${VALID_DIFFICULTY.join(', ')}`);
  }
  if (!Array.isArray(l.objectives)) {
    errors.push('objectives must be an array');
  } else {
    (l.objectives as unknown[]).forEach((o, i) => {
      if (!isString(o)) {
        errors.push(`objectives[${i}] must be a string`);
      }
    });
  }

  if (!isObject(l.initialConditions)) {
    errors.push('initialConditions must be an object');
  } else {
    const ic = l.initialConditions;
    errors.push(...validateOwnship(ic.ownship, 'initialConditions.ownship'));
    if (!Array.isArray(ic.contacts)) {
      errors.push('initialConditions.contacts must be an array');
    } else {
      (ic.contacts as unknown[]).forEach((c, i) => {
        errors.push(...validateContact(c, `initialConditions.contacts[${i}]`));
      });
    }
  }

  errors.push(...validateSensorSettings(l.sensor, 'sensor'));

  if (!Array.isArray(l.tasks)) {
    errors.push('tasks must be an array');
  } else {
    (l.tasks as unknown[]).forEach((t, i) => {
      errors.push(...validateLessonTask(t, `tasks[${i}]`));
    });
  }

  if (!Array.isArray(l.hints)) {
    errors.push('hints must be an array');
  } else {
    (l.hints as unknown[]).forEach((h, i) => {
      errors.push(...validateLessonHint(h, `hints[${i}]`));
    });
  }

  if (!Array.isArray(l.debriefRules)) {
    errors.push('debriefRules must be an array');
  } else {
    (l.debriefRules as unknown[]).forEach((d, i) => {
      errors.push(...validateDebriefRule(d, `debriefRules[${i}]`));
    });
  }

  if (l.tags !== undefined) {
    if (!Array.isArray(l.tags)) {
      errors.push('tags must be an array');
    } else {
      (l.tags as unknown[]).forEach((t, i) => {
        if (!isString(t)) {
          errors.push(`tags[${i}] must be a string`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
