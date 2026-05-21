import { describe, expect, it } from 'vitest';
import {
  generateSonarCue,
  scoreClassify,
  clarityLabel,
  SIGNATURE_CATEGORIES,
} from '../../src/simulation/sonarCues';

describe('generateSonarCue', () => {
  it('has required fields', () => {
    const cue = generateSonarCue(
      'C-1',
      'submarine',
      undefined,
      'low',
      'seed-1',
      60
    );
    expect(cue.contactId).toBe('C-1');
    expect(cue.timestampSec).toBe(60);
    expect(typeof cue.signatureCategory).toBe('string');
    expect(['clear', 'fuzzy', 'garbled']).toContain(cue.clarity);
    expect(typeof cue.confidenceBoost).toBe('number');
  });

  it('uses predefined signature when provided', () => {
    const cue = generateSonarCue(
      'C-1',
      'submarine',
      'whisper-class',
      'low',
      'seed-1',
      60
    );
    expect(cue.signatureCategory).toBe('whisper-class');
  });

  it('is deterministic for same inputs', () => {
    const a = generateSonarCue('C-1', 'submarine', undefined, 'low', 's', 60);
    const b = generateSonarCue('C-1', 'submarine', undefined, 'low', 's', 60);
    expect(a).toEqual(b);
  });

  it('differs for different timestamps', () => {
    const a = generateSonarCue('C-1', 'submarine', undefined, 'low', 's', 60);
    const b = generateSonarCue('C-1', 'submarine', undefined, 'low', 's', 90);
    expect(a).not.toEqual(b);
  });

  it('returned signatures are in known categories', () => {
    const cue = generateSonarCue(
      'C-1',
      'merchant',
      undefined,
      'low',
      'seed-2',
      0
    );
    // The signature will be from the merchant family
    expect(SIGNATURE_CATEGORIES.includes(cue.signatureCategory)).toBe(true);
  });

  it('occasionally produces transient notes', () => {
    let notesCount = 0;
    for (let i = 0; i < 50; i++) {
      const cue = generateSonarCue(
        'C-1',
        'submarine',
        undefined,
        'low',
        `seed-${i}`,
        0
      );
      if (cue.transientNote) notesCount++;
    }
    expect(notesCount).toBeGreaterThan(0);
    expect(notesCount).toBeLessThan(50);
  });
});

describe('scoreClassify', () => {
  it('gives 1.0 for exact match with medium confidence', () => {
    const cue = generateSonarCue(
      'C-1',
      'submarine',
      'whisper-class',
      'low',
      's',
      0
    );
    const score = scoreClassify('submarine', 'medium', 'submarine', cue);
    expect(score).toBe(1.0);
  });

  it('gives 0.0 for wrong guess', () => {
    const cue = generateSonarCue(
      'C-1',
      'submarine',
      'whisper-class',
      'low',
      's',
      0
    );
    const score = scoreClassify('merchant', 'medium', 'submarine', cue);
    expect(score).toBe(0);
  });

  it('penalizes high confidence when wrong', () => {
    const cue = generateSonarCue(
      'C-1',
      'submarine',
      'whisper-class',
      'low',
      's',
      0
    );
    const medium = scoreClassify('merchant', 'medium', 'submarine', cue);
    const high = scoreClassify('merchant', 'high', 'submarine', cue);
    expect(high).toBeLessThanOrEqual(medium);
  });

  it('gives partial credit on garbled with family match', () => {
    const cue = {
      contactId: 'C-1',
      timestampSec: 0,
      signatureCategory: 'whisper-class',
      clarity: 'garbled' as const,
      confidenceBoost: -0.4,
    };
    // When garbled, any sub-signature counts
    const score = scoreClassify('whisper-class', 'high', 'submarine', cue);
    expect(score).toBeGreaterThan(0);
  });

  it('gives partial credit on garbled with overlapping category family', () => {
    const cue = {
      contactId: 'C-1',
      timestampSec: 0,
      signatureCategory: 'ghost-class',
      clarity: 'garbled' as const,
      confidenceBoost: -0.4,
    };

    const score = scoreClassify('biologic', 'high', 'submarine', cue);

    expect(score).toBeGreaterThan(0);
  });
});

describe('clarityLabel', () => {
  it('returns string for each clarity', () => {
    expect(clarityLabel('clear')).toBeTruthy();
    expect(clarityLabel('fuzzy')).toBeTruthy();
    expect(clarityLabel('garbled')).toBeTruthy();
  });
});
