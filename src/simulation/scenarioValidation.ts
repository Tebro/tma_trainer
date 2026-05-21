import type { ClassificationAmbiguity, ContactCategory } from './scenarioTypes';

const VALID_CATEGORIES: ContactCategory[] = [
  'merchant',
  'submarine',
  'surface-combatant',
  'biologic',
  'unknown',
];

const VALID_AMBIGUITY: ClassificationAmbiguity[] = ['low', 'medium', 'high'];

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

function validateVector2(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const v = obj as Record<string, unknown>;
  if (!isNumber(v.x)) {
    errors.push(`${path}.x must be a number`);
  }
  if (!isNumber(v.y)) {
    errors.push(`${path}.y must be a number`);
  }
  return errors;
}

function validateManeuver(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const m = obj as Record<string, unknown>;
  if (!isNumber(m.timeSec)) {
    errors.push(`${path}.timeSec must be a number`);
  } else if (m.timeSec < 0) {
    errors.push(`${path}.timeSec must be >= 0`);
  }
  if (m.course !== undefined) {
    if (!isNumber(m.course) || m.course < 0 || m.course > 360) {
      errors.push(`${path}.course must be a number between 0 and 360`);
    }
  }
  if (m.speed !== undefined) {
    if (!isNumber(m.speed) || m.speed < 0) {
      errors.push(`${path}.speed must be a non-negative number`);
    }
  }
  return errors;
}

export function validateOwnship(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const o = obj as Record<string, unknown>;
  errors.push(...validateVector2(o.position, `${path}.position`));
  if (!isNumber(o.course) || o.course < 0 || o.course > 360) {
    errors.push(`${path}.course must be a number between 0 and 360`);
  }
  if (!isNumber(o.speed) || o.speed < 0) {
    errors.push(`${path}.speed must be a non-negative number`);
  }
  if (o.maneuvers !== undefined) {
    if (!Array.isArray(o.maneuvers)) {
      errors.push(`${path}.maneuvers must be an array`);
    } else {
      (o.maneuvers as unknown[]).forEach((m, i) => {
        errors.push(...validateManeuver(m, `${path}.maneuvers[${i}]`));
      });
    }
  }
  return errors;
}

export function validateContact(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const c = obj as Record<string, unknown>;
  if (!isString(c.id) || c.id.length === 0) {
    errors.push(`${path}.id must be a non-empty string`);
  }
  if (
    !isString(c.category) ||
    !VALID_CATEGORIES.includes(c.category as ContactCategory)
  ) {
    errors.push(
      `${path}.category must be one of ${VALID_CATEGORIES.join(', ')}`
    );
  }
  errors.push(...validateVector2(c.position, `${path}.position`));
  if (!isNumber(c.course) || c.course < 0 || c.course > 360) {
    errors.push(`${path}.course must be a number between 0 and 360`);
  }
  if (!isNumber(c.speed) || c.speed < 0) {
    errors.push(`${path}.speed must be a non-negative number`);
  }
  if (c.maneuvers !== undefined) {
    if (!Array.isArray(c.maneuvers)) {
      errors.push(`${path}.maneuvers must be an array`);
    } else {
      (c.maneuvers as unknown[]).forEach((m, i) => {
        errors.push(...validateManeuver(m, `${path}.maneuvers[${i}]`));
      });
    }
  }
  return errors;
}

export function validateSensorSettings(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  const s = obj as Record<string, unknown>;
  if (!isNumber(s.bearingNoiseDeg) || s.bearingNoiseDeg < 0) {
    errors.push(`${path}.bearingNoiseDeg must be a non-negative number`);
  }
  if (!isNumber(s.updateIntervalSec) || s.updateIntervalSec <= 0) {
    errors.push(`${path}.updateIntervalSec must be a positive number`);
  }
  if (
    !isString(s.classificationAmbiguity) ||
    !VALID_AMBIGUITY.includes(
      s.classificationAmbiguity as ClassificationAmbiguity
    )
  ) {
    errors.push(
      `${path}.classificationAmbiguity must be one of ${VALID_AMBIGUITY.join(', ')}`
    );
  }
  if (s.contactDropouts !== undefined) {
    if (!Array.isArray(s.contactDropouts)) {
      errors.push(`${path}.contactDropouts must be an array`);
    } else {
      s.contactDropouts.forEach((dropout, i) => {
        const dropoutPath = `${path}.contactDropouts[${i}]`;
        if (!isObject(dropout)) {
          errors.push(`${dropoutPath} must be an object`);
          return;
        }
        if (!isString(dropout.contactId) || dropout.contactId.length === 0) {
          errors.push(`${dropoutPath}.contactId must be a non-empty string`);
        }
        if (!isNumber(dropout.startSec) || dropout.startSec < 0) {
          errors.push(`${dropoutPath}.startSec must be a non-negative number`);
        }
        if (!isNumber(dropout.endSec) || dropout.endSec < 0) {
          errors.push(`${dropoutPath}.endSec must be a non-negative number`);
        }
        if (
          isNumber(dropout.startSec) &&
          isNumber(dropout.endSec) &&
          dropout.endSec < dropout.startSec
        ) {
          errors.push(`${dropoutPath}.endSec must be >= startSec`);
        }
      });
    }
  }
  return errors;
}

function validateScenarioTask(obj: unknown, path: string): string[] {
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
  return errors;
}

function validateScenarioHint(obj: unknown, path: string): string[] {
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

export function validateScenario(obj: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isObject(obj)) {
    return { valid: false, errors: ['Input must be an object'] };
  }

  const s = obj as Record<string, unknown>;

  if (!isString(s.id) || s.id.length === 0) {
    errors.push('id must be a non-empty string');
  }
  if (!isString(s.title) || s.title.length === 0) {
    errors.push('title must be a non-empty string');
  }
  if (s.description !== undefined && !isString(s.description)) {
    errors.push('description must be a string if provided');
  }

  errors.push(...validateOwnship(s.ownship, 'ownship'));
  errors.push(...validateSensorSettings(s.sensor, 'sensor'));

  if (!Array.isArray(s.contacts)) {
    errors.push('contacts must be an array');
  } else {
    (s.contacts as unknown[]).forEach((c, i) => {
      errors.push(...validateContact(c, `contacts[${i}]`));
    });
  }

  if (!Array.isArray(s.tasks)) {
    errors.push('tasks must be an array');
  } else {
    (s.tasks as unknown[]).forEach((t, i) => {
      errors.push(...validateScenarioTask(t, `tasks[${i}]`));
    });
  }

  if (!Array.isArray(s.hints)) {
    errors.push('hints must be an array');
  } else {
    (s.hints as unknown[]).forEach((h, i) => {
      errors.push(...validateScenarioHint(h, `hints[${i}]`));
    });
  }

  if (!Array.isArray(s.debriefRules)) {
    errors.push('debriefRules must be an array');
  } else {
    (s.debriefRules as unknown[]).forEach((d, i) => {
      errors.push(...validateDebriefRule(d, `debriefRules[${i}]`));
    });
  }

  if (!isNumber(s.durationSec) || s.durationSec <= 0) {
    errors.push('durationSec must be a positive number');
  }

  if (s.environment !== undefined && !isObject(s.environment)) {
    errors.push('environment must be an object if provided');
  }

  return { valid: errors.length === 0, errors };
}
