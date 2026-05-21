import { describe, expect, it } from 'vitest';
import {
  generateDrill,
  getDrillTemplateIds,
  type DrillTemplate,
} from '../../src/simulation/drillGenerator';

const TEMPLATES: DrillTemplate[] = [
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

describe('getDrillTemplateIds', () => {
  it('returns all templates', () => {
    expect(getDrillTemplateIds()).toEqual(TEMPLATES);
  });
});

describe('generateDrill', () => {
  it.each(TEMPLATES)('produces valid scenario for %s', (template) => {
    const scenario = generateDrill(template, 'normal', 'test-seed-42');
    expect(scenario.id).toContain('drill-test-seed-42');
    expect(scenario.title).toBeTruthy();
    expect(scenario.ownship.speed).toBeGreaterThan(0);
    expect(scenario.sensor.bearingNoiseDeg).toBeGreaterThan(0);
    expect(scenario.sensor.updateIntervalSec).toBeGreaterThan(0);
    expect(scenario.durationSec).toBeGreaterThan(0);
  });

  it('is deterministic for the same inputs', () => {
    const a = generateDrill('crossing', 'normal', 'seed-abc');
    const b = generateDrill('crossing', 'normal', 'seed-abc');
    expect(a).toEqual(b);
  });

  it('varies across seeds', () => {
    const a = generateDrill('crossing', 'normal', 'seed-a');
    const b = generateDrill('crossing', 'normal', 'seed-b');
    const same =
      a.contacts[0].position.x === b.contacts[0].position.x &&
      a.contacts[0].position.y === b.contacts[0].position.y;
    expect(same).toBe(false);
  });

  it('varies difficulty settings', () => {
    const easy = generateDrill('constant-bearing', 'easy', 'seed-1');
    const hard = generateDrill('constant-bearing', 'hard', 'seed-1');
    expect(easy.sensor.bearingNoiseDeg).toBeLessThan(
      hard.sensor.bearingNoiseDeg
    );
    expect(easy.sensor.updateIntervalSec).toBeLessThanOrEqual(
      hard.sensor.updateIntervalSec
    );
  });

  describe('two-contact-classification', () => {
    it('has exactly 2 contacts', () => {
      const s = generateDrill('two-contact-classification', 'normal', 's1');
      expect(s.contacts).toHaveLength(2);
    });

    it('contacts have signatures', () => {
      const s = generateDrill('two-contact-classification', 'normal', 's2');
      expect(s.contacts[0].signature).toBeTruthy();
      expect(s.contacts[1].signature).toBeTruthy();
    });

    it('uses faster update interval for two contacts', () => {
      const s = generateDrill('two-contact-classification', 'normal', 's3');
      expect(s.sensor.updateIntervalSec).toBe(25);
    });
  });

  describe('high-noise-bearing-only', () => {
    it('uses one contact and elevated bearing noise', () => {
      const s = generateDrill('high-noise-bearing-only', 'normal', 'hn1');
      expect(s.contacts).toHaveLength(1);
      expect(s.sensor.bearingNoiseDeg).toBeGreaterThanOrEqual(6);
      expect(s.sensor.classificationAmbiguity).toBe('high');
    });
  });

  describe('maneuver-timing', () => {
    it('provides maneuver-focused tasks and one contact', () => {
      const s = generateDrill('maneuver-timing', 'normal', 'mt1');
      expect(s.contacts).toHaveLength(1);
      expect(s.tasks.some((t) => /maneuver/i.test(t.title))).toBe(true);
      expect(s.durationSec).toBeGreaterThanOrEqual(420);
    });
  });

  describe('rapid-estimate', () => {
    it('uses a short duration and fast updates', () => {
      const s = generateDrill('rapid-estimate', 'normal', 're1');
      expect(s.contacts).toHaveLength(1);
      expect(s.durationSec).toBeLessThanOrEqual(150);
      expect(s.sensor.updateIntervalSec).toBeLessThanOrEqual(10);
    });
  });

  describe('lost-contact-reacquire', () => {
    it('defines a contact dropout window', () => {
      const s = generateDrill('lost-contact-reacquire', 'normal', 'lc1');
      expect(s.contacts).toHaveLength(1);
      expect(s.sensor.contactDropouts).toEqual([
        expect.objectContaining({
          contactId: 'CONTACT-1',
          startSec: expect.any(Number),
          endSec: expect.any(Number),
        }),
      ]);
    });
  });

  it('constant-bearing contact has course near ownship (90°)', () => {
    const s = generateDrill('constant-bearing', 'normal', 's4');
    const contact = s.contacts[0];
    // Course should be within ±20° of ownship course
    const diff = Math.abs(
      ((contact.course - s.ownship.course + 540) % 360) - 180
    );
    expect(diff).toBeLessThanOrEqual(20);
  });

  it('crossing contact has course roughly perpendicular to ownship', () => {
    const s = generateDrill('crossing', 'normal', 's5');
    const contact = s.contacts[0];
    const diff = Math.abs(
      ((contact.course - s.ownship.course + 540) % 360) - 180
    );
    expect(diff).toBeGreaterThanOrEqual(60);
    expect(diff).toBeLessThanOrEqual(120);
  });

  it('closing contact has course roughly toward ownship', () => {
    const s = generateDrill('closing', 'normal', 's6');
    const contact = s.contacts[0];
    const diff = Math.abs(
      ((contact.course - s.ownship.course + 540) % 360) - 180
    );
    expect(diff).toBeGreaterThanOrEqual(160);
    expect(diff).toBeLessThanOrEqual(180);
  });

  it('opening contact has course similar to ownship but faster', () => {
    const s = generateDrill('opening', 'normal', 's7');
    const contact = s.contacts[0];
    const diff = Math.abs(
      ((contact.course - s.ownship.course + 540) % 360) - 180
    );
    expect(diff).toBeLessThanOrEqual(20);
    expect(contact.speed).toBeGreaterThan(s.ownship.speed);
  });
});
